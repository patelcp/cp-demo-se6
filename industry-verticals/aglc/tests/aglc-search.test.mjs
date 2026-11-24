import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

function load(path, substitutes = {}) {
  const output = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = createRequire(path);
  const resolve = (name) => {
    if (Object.hasOwn(substitutes, name)) return substitutes[name];
    if (!name.startsWith('.')) return localRequire(name);
    const tsx = new URL(name + '.tsx', path);
    return load(existsSync(tsx) ? tsx : new URL(name + '.ts', path), substitutes);
  };
  new Function('require', 'module', 'exports', output)(resolve, module, module.exports);
  return module.exports;
}

const fromApp = (path, substitutes) => load(new URL('../src/' + path, import.meta.url), substitutes);
const sourceId = '218abacc-359b-4743-80d9-2611541be10e';
const formsId = '37ab309640b7490abc2eaf3bbe64c9c0';
const liquorId = 'a23891b4fbc342648738603c74d48c60';
const cannabisSenseId = '4254bcfa-b9c3-485a-aadb-8b5b3f8fd08d';
const inquiryDraftId = '2398befb-6b8f-418c-a56b-47aecc61b94a';
const defaultEnv = {
  AGLC_SEARCH_INDEX_ID: sourceId,
  AGLC_SEARCH_CONTEXT_ID: 'test-context-not-a-live-key',
  AGLC_SEARCH_SUMMARY_FIELD: 'sc_description',
};
const phoneLikeBody = { query: ' forms ', indexId: sourceId };
const request = (body = phoneLikeBody, headers = { 'content-type': 'application/json' }) => new Request(
  'https://aglc-preview.example/api/aglc-search',
  { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) },
);
const handler = fromApp('lib/aglc-search-handler.ts').handleAglcSearch;
const { nativeResultCap } = fromApp('lib/aglc-search-server.ts');

test('route contract: search receives reviewed index config, strips every other-site/draft result, returns only AGLC counts', async () => {
  const fetchCalls = [];
  const route = fromApp('app/api/aglc-search/route.ts', {
    '@sitecore-content-sdk/search': {
      SearchService: class {
        constructor(config) { this.config = config; }
        async search(p, opts) {
          fetchCalls.push({ p, opts, config: this.config });
          return { total: 6, results: [
            { sc_item_id: cannabisSenseId, Title: 'Foreign result', url: 'https://foreign.example' },
            { sc_item_id: '{37AB3096-40B7-490A-BC2E-AF3BBE64C9C0}', Title: 'Forms and documents', sc_description: '<p>Approved forms</p>', url: 'https://foreign.example' },
            { sc_item_id: inquiryDraftId, Title: 'Draft inquiry' },
            { sc_item_id: formsId, Title: 'duplicate' },
            { sc_item_id: liquorId, Title: '' },
            { sc_item_id: '986b11cfe8c54f52a7be64a21bef4b09', Title: 'Other tenant content' },
          ] };
        }
      },
    },
  });
  const saved = {};
  for (const [key, value] of Object.entries(defaultEnv)) {
    saved[key] = process.env[key];
    process.env[key] = value;
  }
  try {
    const response = await route.POST(request());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await response.json(), { total: 2, results: [
      { id: formsId, href: '/forms', title: 'Forms and documents', summary: 'Approved forms' },
      { id: liquorId, href: '/liquor', title: 'Liquor' },
    ] });
    assert.equal(fetchCalls.length, 1);
    assert.deepEqual(fetchCalls[0].p, { searchIndexId: sourceId, keyphrase: 'forms', limit: nativeResultCap });
    assert.equal(fetchCalls[0].opts.cache, 'no-store');
    assert.ok(fetchCalls[0].opts.signal instanceof AbortSignal);
    assert.equal(fetchCalls[0].config.contextId, defaultEnv.AGLC_SEARCH_CONTEXT_ID);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('a source containing only foreign items has zero AGLC results, never the foreign total', async () => {
  const response = await handler(request(), defaultEnv, () => ({ search: async () => ({
    total: 2, results: [{ sc_item_id: cannabisSenseId }, { sc_item_id: inquiryDraftId }],
  }) }));
  assert.deepEqual(await response.json(), { results: [], total: 0 });
});

test('an incomplete, too large, or unidentifiable source fails without partial results or a false zero', async () => {
  for (const reply of [
    { total: nativeResultCap + 1, results: [{ sc_item_id: formsId }] },
    { total: 2, results: [{ sc_item_id: formsId }] },
    { total: 0, results: [{ sc_item_id: formsId }] },
    { total: 1, results: [{ Title: 'Missing identity', route: '/forms' }] },
    { total: 2, results: [{ sc_item_id: formsId }, { sc_item_id: 'noncanonical', Title: 'Other' }] },
    { total: 1, results: [null] },
  ]) {
    const response = await handler(request(), defaultEnv, () => ({ search: async () => reply }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'search_unavailable' });
  }
});

test('index mismatch, source not verified, unsuitable query, and wrong media type never call Search', async () => {
  let calls = 0;
  const client = () => { calls++; throw new Error('must not initiate a request'); };
  assert.equal((await handler(request({ ...phoneLikeBody, indexId: cannabisSenseId }), defaultEnv, client)).status, 503);
  assert.equal((await handler(request(), { AGLC_SEARCH_CONTEXT_ID: 'set' }, client)).status, 503);
  assert.equal((await handler(request(), { AGLC_SEARCH_INDEX_ID: sourceId }, client)).status, 503);
  assert.equal((await handler(request({ ...phoneLikeBody, query: '' }), defaultEnv, client)).status, 400);
  assert.equal((await handler(request({ ...phoneLikeBody, query: 'x'.repeat(130) }), defaultEnv, client)).status, 400);
  assert.equal((await handler(request({ ...phoneLikeBody, query: '\u0000s' }), defaultEnv, client)).status, 400);
  assert.equal((await handler(request('x'.repeat(1025)), defaultEnv, client)).status, 400);
  assert.equal((await handler(request(phoneLikeBody, { 'content-type': 'text/plain' }), defaultEnv, client)).status, 400);
  assert.equal(calls, 0);
});

test('rehearsal can set the observed identity/title/language switches without trusting arbitrary URL fields', async () => {
  const response = await handler(request(), {
    ...defaultEnv, AGLC_SEARCH_ID_FIELD: 'sc_itemid', AGLC_SEARCH_TITLE_FIELD: 'pagetitle', AGLC_SEARCH_LOCALE: 'en-CA',
  }, () => ({ search: async (params) => {
    assert.equal(params.locale, 'en-CA');
    return { total: 1, results: [{ sc_itemid: formsId, pagetitle: 'AGLC forms', sc_url: '//invalid.example' }] };
  } }));
  assert.deepEqual(await response.json(), { total: 1, results: [{ id: formsId, href: '/forms', title: 'AGLC forms' }] });
});

test('existing forms still submit to the public site; only exact internal path with q is allowed', () => {
  const helpers = fromApp('lib/aglc-search-contract.ts');
  assert.deepEqual(helpers.resolveSearchDestination('https://aglc.ca/search-results?opq=discarded&fixed=1', 'opq'), {
    action: 'https://aglc.ca/search-results', params: [['fixed','1']],
  });
  assert.deepEqual(helpers.resolveSearchDestination('/search-results', 'q'), { action: '/search-results', params: [] });
  assert.equal(helpers.resolveSearchDestination('/search-results', 'opq'), undefined);
  assert.equal(helpers.resolveSearchDestination('//external.example/search-results', 'q'), undefined);
  assert.equal(helpers.resolveSearchDestination('/search-results?extra=1', 'q'), undefined);
  assert.equal(helpers.resolveSearchDestination('http://aglc.ca/search-results', 'opq'), undefined);
  const NativeSearch = fromApp('lib/native-controls.tsx').NativeSearch;
  const markup = renderToStaticMarkup(React.createElement(NativeSearch, {
    fields: {
      SearchAction: { jsonValue: { value: { href: '/search-results' } } },
      SearchLabel: { jsonValue: { value: 'Search AGLC' } },
      SearchQueryName: { jsonValue: { value: 'q' } },
    },
  }));
  assert.match(markup, /action="\/search-results" method="get"/);
  assert.match(markup, /name="q"/);
});

test('component accepts a native source, supports q on staged AGLC results, and never enables in other sites or editing/preview', () => {
  const source = { search: { value: JSON.stringify({ searchIndex: sourceId, fieldsMapping: [] }) } };
  const Search = fromApp('components/search-experience/SearchExperience.tsx', {
    'next/navigation': { useSearchParams: () => new URLSearchParams({ q: 'forms' }) },
  }).Default;
  const show = (siteName, mode = {}, fields = source) => renderToStaticMarkup(React.createElement(Search, {
    fields, page: { siteName, mode },
  }));
  assert.equal(show('cannabissense'), '');
  assert.match(show('aglc', { isEditing: true }), /disabled in Page Builder and Preview/);
  assert.match(show('aglc', { isPreview: true }), /disabled in Page Builder and Preview/);
  assert.doesNotMatch(show('aglc', { isPreview: true }), /<form/);
  assert.match(show('aglc'), /action="\/search-results".*value="forms"/);
  assert.match(show('aglc', {}, { search: { value: 'garbage' } }), /isn’t available/);
});

test('installed Sitecore SDK sends a native keyword request with no browser session identifier and no analytics', async () => {
  const { SearchService } = createRequire(import.meta.url)('@sitecore-content-sdk/search');
  const originalFetch = globalThis.fetch;
  const captured = [];
  globalThis.fetch = async (input, init) => {
    const target = new URL(typeof input === 'string' ? input : input.url);
    const headers = new Headers(init.headers);
    captured.push({ path: target.pathname, method: init.method, body: JSON.parse(init.body), context: headers.get('x-sitecore-contextid'), cookie: headers.get('cookie') });
    return Response.json({ content: [
      { sc_item_id: formsId, Title: 'Forms and documents' }, { sc_item_id: cannabisSenseId, Title: 'Other site' },
    ], total: 2 });
  };
  try {
    const response = await handler(request(), defaultEnv, (contextId) => new SearchService({
      contextId, edgeUrl: 'https://edge.sdk.test',
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      total: 1,
      results: [{ id: formsId, href: '/forms', title: 'Forms and documents' }],
    });
    assert.equal(captured.length, 1);
    assert.equal(captured[0].method, 'POST');
    assert.equal(captured[0].path, '/v1/search');
    assert.equal(captured[0].context, defaultEnv.AGLC_SEARCH_CONTEXT_ID);
    assert.equal(captured[0].cookie, null);
    assert.equal(captured[0].body.config.id, sourceId);
    assert.deepEqual(captured[0].body.query, { keyphrase: 'forms' });
    assert.equal(captured[0].body.sessionId || '', '');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
