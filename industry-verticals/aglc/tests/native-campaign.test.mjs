import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { NextRequest, NextResponse } from 'next/server.js';

const globals = new Map();
function load(path, substitutes = globals) {
  const out = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const local = createRequire(path);
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', out)(name => {
    if (substitutes.has(name)) return substitutes.get(name);
    if (name.startsWith('.')) return load(new URL(name + '.ts', path), substitutes);
    return local(name);
  }, mod, mod.exports);
  return mod.exports;
}
const core = load(new URL('../src/lib/cannabissense-personalization.ts', import.meta.url));
const api = load(new URL('../src/app/api/cannabissense-personalization/route.ts', import.meta.url));
const { DEMO_HOST, DEMO_ORIGIN, DEMO_PATH, CONSENT_COOKIE, DEMO_CAMPAIGN } = core;
const search = query => new URLSearchParams(query);
const form = (body, origin = DEMO_ORIGIN, host = DEMO_HOST) => new NextRequest(DEMO_ORIGIN + '/api/cannabissense-personalization', {
  method: 'POST', body, headers: { host, origin, 'content-type': 'application/x-www-form-urlencoded' },
});
const tag = 'utm_campaign=' + DEMO_CAMPAIGN;
const setEnable = (t, value = '1') => {
  const previous = process.env.CANNABISSENSE_NATIVE_PERSONALIZATION;
  process.env.CANNABISSENSE_NATIVE_PERSONALIZATION = value;
  t.after(() => {
    if (previous === undefined) delete process.env.CANNABISSENSE_NATIVE_PERSONALIZATION;
    else process.env.CANNABISSENSE_NATIVE_PERSONALIZATION = previous;
  });
};

test('native campaign context accepts only the exact demo inputs, never infers a source or consent', () => {
  assert.deepEqual(core.campaignContext(search(tag)), { campaign: DEMO_CAMPAIGN, source: undefined });
  assert.deepEqual(core.campaignContext(search(tag + '&utm_source=instagram')), { campaign: DEMO_CAMPAIGN, source: 'instagram' });
  for (const input of ['utm_campaign=other', tag + '&' + tag, tag + '&utm_source=other',
    tag + '&utm_source=instagram&utm_source=instagram', tag + '&utm_content=any',
    tag + '&email=hidden', tag + '&utm_source=', '']) {
    assert.equal(core.campaignContext(search(input)), null, input);
  }
  assert.equal(core.consentRemainingSeconds(undefined), 0);
  assert.equal(core.consentRemainingSeconds('1700000001', 1700000000000), 1);
  assert.equal(core.consentRemainingSeconds('1700000001', 1700000001000), 0);
  assert.equal(core.consentRemainingSeconds('1700001801', 1700000000000), 0);
});

test('consent posts are disabled by default or on other hosts and reject cross-origin/invalid POSTs', async t => {
  setEnable(t, '0');
  assert.equal((await api.POST(form('choice=allow'))).status, 404);
  process.env.CANNABISSENSE_NATIVE_PERSONALIZATION = '1';
  assert.equal((await api.POST(form('choice=allow', DEMO_ORIGIN, 'aglc-cp.vercel.app'))).status, 404);
  assert.equal((await api.POST(form('choice=allow', 'https://example.org'))).status, 403);
  assert.equal((await api.POST(form('choice=allow&choice=revoke'))).status, 400);
});

test('explicit allow keeps only approved URL context; revoke expires three local cookies', async t => {
  setEnable(t);
  const allow = await api.POST(form('choice=allow&' + tag));
  assert.equal(allow.status, 303);
  assert.equal(allow.headers.get('location'), DEMO_ORIGIN + '/basics?' + tag);
  const cookie = allow.cookies.get(CONSENT_COOKIE);
  assert.equal(cookie.path, '/basics');
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.secure, true);
  assert.equal(cookie.sameSite, 'lax');
  assert.equal(cookie.domain, undefined);
  assert.ok(core.consentRemainingSeconds(cookie.value) > 0);
  assert.equal((await api.POST(form('choice=allow&redirect=https://example.org'))).headers.get('location'), DEMO_ORIGIN + '/basics');
  const revoke = await api.POST(form('choice=revoke&' + tag));
  assert.equal(revoke.headers.get('location'), DEMO_ORIGIN + '/basics');
  assert.equal(revoke.headers.get('cache-control'), 'private, no-store');
  for (const name of [CONSENT_COOKIE, 'sc_cid', 'sc_cid_personalize']) {
    assert.equal(revoke.cookies.get(name).maxAge, 0);
    assert.equal(revoke.cookies.get(name).path, '/basics');
  }
});

test('native proxy rejects wrong site, language, path, method, context and absent consent; minimizes payload', t => {
  setEnable(t);
  class NativeProxyBoundary {
    getSite(req) { return { name: req.headers.get('demo-test-site') || 'cannabissense' }; }
    getLanguage(req) { return req.headers.get('demo-test-language') || 'en'; }
    disabled() { return false; }
  }
  const substitutes = new Map([['@sitecore-content-sdk/nextjs/proxy', { PersonalizeProxy: NativeProxyBoundary }]]);
  const { CannabisSensePersonalizeProxy } = load(new URL('../src/lib/cannabissense-personalize-proxy.ts', import.meta.url), substitutes);
  const native = new CannabisSensePersonalizeProxy();
  const expiry = Math.floor(Date.now() / 1000) + 1200;
  const req = (path, extras = {}, method = 'GET') => new NextRequest(DEMO_ORIGIN + path, {
    method, headers: { host: DEMO_HOST, cookie: CONSENT_COOKIE + '=' + expiry, referer: 'https://external.example/private', ...extras },
  });
  for (const request of [req('/basics?' + tag, { cookie: '' }), req('/basics?' + tag, { host: 'aglc-cp.vercel.app' }),
    req('/resources?' + tag), req('/basics'), req('/basics?utm_campaign=wrong'),
    req('/basics?' + tag, {'demo-test-site': 'aglc'}), req('/basics?' + tag, {'demo-test-language': 'fr'}),
    req('/basics?' + tag, {}, 'HEAD')]) {
    assert.equal(native.disabled(request, NextResponse.next()), true);
  }
  const allowed = req('/basics?' + tag);
  assert.equal(native.disabled(allowed, NextResponse.next()), false);
  assert.deepEqual(native.getExperienceParams(allowed), {
    referrer: '', utm: { campaign: DEMO_CAMPAIGN, source: undefined, medium: undefined, content: undefined },
  });
});

test('public requests cannot opt in by addressing an SDK-internal rewrite directly', () => {
  for (const path of ['/basics/_variantId_candidate', '/cannabissense/en/basics/%5FvariantId_candidate']) {
    assert.equal(core.isExternalVariantPath(path), true);
  }
  assert.equal(core.isExternalVariantPath(DEMO_PATH), false);
});

test('proxy entry applies privacy headers and shortens native visitor cookies on the scoped journey only', async t => {
  setEnable(t);
  class OtherProxy {}
  class NativeProxy {
    constructor() {}
    getSite() { return { name: 'cannabissense' }; }
    getLanguage() { return 'en'; }
    disabled() { return false; }
  }
  const stubs = new Map([
    ['.sitecore/sites.json', { default: [] }],
    ['sitecore.config', { default: { api: { edge: {}, local: {} } } }],
    ['./lib/sitecore-client', {}],
    ['./i18n/routing', { routing: { locales: ['en'] } }],
    ['@sitecore-content-sdk/nextjs/proxy', {
      PersonalizeProxy: NativeProxy, PreviewProxy: OtherProxy, AppRouterMultisiteProxy: OtherProxy,
      RedirectsProxy: OtherProxy, LocaleProxy: OtherProxy,
      defineProxy: (...instances) => ({
        exec: async req => {
          const response = NextResponse.next();
          if (!instances[4].disabled(req, response)) {
            response.cookies.set('sc_cid', 'synthetic', { domain: DEMO_HOST, path: '/', sameSite: 'none', maxAge: 730 * 86400 });
            response.cookies.set('sc_cid_personalize', 'synthetic', { domain: DEMO_HOST, path: '/', sameSite: 'none', maxAge: 730 * 86400 });
          }
          return response;
        },
      }),
    }],
  ]);
  const { default: proxy } = load(new URL('../src/proxy.ts', import.meta.url), stubs);
  const expiry = Math.floor(Date.now() / 1000) + 300;
  const request = (path, cookie = '', host = DEMO_HOST) => new NextRequest('https://' + host + path, {
    headers: { host, cookie },
  });
  const denied = await proxy(request('/basics?' + tag));
  assert.equal(denied.cookies.get('sc_cid'), undefined);
  assert.equal(denied.headers.get('cache-control'), 'private, no-store');
  assert.equal(denied.headers.get('referrer-policy'), 'no-referrer');
  const granted = await proxy(request('/basics?' + tag, CONSENT_COOKIE + '=' + expiry));
  for (const key of core.SITECORE_COOKIES) {
    const cookie = granted.cookies.get(key);
    assert.equal(cookie.path, '/basics');
    assert.equal(cookie.domain, undefined);
    assert.equal(cookie.secure, true);
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.sameSite, 'lax');
    assert.ok(cookie.maxAge > 0 && cookie.maxAge <= 300);
  }
  const outside = await proxy(request('/resources?' + tag, CONSENT_COOKIE + '=' + expiry));
  assert.equal(outside.cookies.get('sc_cid'), undefined);
  assert.equal(outside.headers.get('cache-control'), null);
  assert.equal((await proxy(request('/basics/_variantId_candidate'))).status, 404);
});

test('AGLC Home pilot has an independent flag, exact same-origin consent and no campaign payload', async t => {
  const old = process.env.AGLC_NATIVE_PERSONALIZATION;
  t.after(() => old === undefined ? delete process.env.AGLC_NATIVE_PERSONALIZATION : process.env.AGLC_NATIVE_PERSONALIZATION = old);
  setEnable(t, '0');
  const aglcHost = core.AGLC_HOST;
  const aglcOrigin = 'https://' + aglcHost;
  process.env.AGLC_NATIVE_PERSONALIZATION = '0';
  assert.equal((await api.POST(form('choice=allow', aglcOrigin, aglcHost))).status, 404);
  process.env.AGLC_NATIVE_PERSONALIZATION = '1';
  assert.equal((await api.POST(form('choice=allow', DEMO_ORIGIN, aglcHost))).status, 403);
  assert.equal((await api.POST(form('choice=allow'))).status, 404);
  const optIn = await api.POST(form('choice=allow&' + tag, aglcOrigin, aglcHost));
  assert.equal(optIn.headers.get('location'), aglcOrigin + '/');
  assert.equal(optIn.cookies.get(CONSENT_COOKIE), undefined);
  const consent = optIn.cookies.get(core.AGLC_CONSENT_COOKIE);
  assert.equal(consent.path, '/');
  assert.equal(consent.domain, undefined);
  assert.ok(core.consentRemainingSeconds(consent.value) > 0);
  class NativeBoundary {
    getSite(req) { return { name: req.headers.get('fixture-site') ?? 'aglc' }; }
    getLanguage() { return 'en'; }
    disabled() { return false; }
  }
  const { CannabisSensePersonalizeProxy } = load(new URL('../src/lib/cannabissense-personalize-proxy.ts', import.meta.url),
    new Map([['@sitecore-content-sdk/nextjs/proxy', { PersonalizeProxy: NativeBoundary }]]));
  const native = new CannabisSensePersonalizeProxy();
  const req = (path, extras = {}) => new NextRequest(aglcOrigin + path, {
    headers: { host: aglcHost, cookie: core.AGLC_CONSENT_COOKIE + '=' + consent.value,
      referer: 'https://outside.example/example', ...extras },
  });
  assert.equal(native.disabled(req('/'), NextResponse.next()), false);
  assert.equal(native.disabled(req('/gaming'), NextResponse.next()), true);
  assert.equal(native.disabled(req('/?' + tag), NextResponse.next()), true);
  assert.equal(native.disabled(req('/', {cookie: CONSENT_COOKIE + '=' + consent.value}), NextResponse.next()), true);
  assert.equal(native.disabled(req('/', {'fixture-site': 'cannabissense'}), NextResponse.next()), true);
  assert.deepEqual(native.getExperienceParams(req('/')), {
    referrer: '', utm: { campaign: undefined, source: undefined, content: undefined, medium: undefined },
  });
  const optOut = await api.POST(form('choice=revoke', aglcOrigin, aglcHost));
  for (const name of [core.AGLC_CONSENT_COOKIE, ...core.SITECORE_COOKIES]) {
    assert.equal(optOut.cookies.get(name).path, '/');
    assert.equal(optOut.cookies.get(name).maxAge, 0);
    assert.equal(optOut.cookies.get(name).domain, undefined);
  }
});
