import type { SearchParameters } from '@sitecore-content-sdk/search';
import { asRecord, normalizeGuid } from './aglc-search-contract';
import type { AglcSearchResults } from './aglc-search-contract';

type SitecoreReply = { total: number; results: unknown[] };
type SearchClient = {
  search(params: SearchParameters, options: { signal: AbortSignal; cache: 'no-store' }): Promise<SitecoreReply>;
};

interface NativeSearchScope {
  searchIndexId: string;
  nativeIndexId: string;
  identityField: string;
  titleField: string;
  summaryField?: string;
  locale?: string;
}

/** Preverified and already published English AGLC pages; no shared partials or draft routes. */
const publishedAglcPages = new Map<string, { href: string; fallbackTitle: string }>([
  ['b25704d668a64e4096a5b869529e992c', { href: '/', fallbackTitle: 'AGLC' }],
  ['894832e90bdf46679f277fbbd0d6eab9', { href: '/gaming', fallbackTitle: 'Gaming' }],
  ['a23891b4fbc342648738603c74d48c60', { href: '/liquor', fallbackTitle: 'Liquor' }],
  ['b4193cd8bdd64486b2a45ea7385f2cc4', { href: '/cannabis', fallbackTitle: 'Cannabis' }],
  ['37ab309640b7490abc2eaf3bbe64c9c0', { href: '/forms', fallbackTitle: 'Forms and documents' }],
]);

// A bounded pilot. Never render a partial page, foreign-index counts, or a false zero.
export const nativeResultCap = 100;
const allowedFieldName = /^[a-zA-Z][a-zA-Z\d_-]{0,63}$/u;

function fieldName(value: string | undefined, fallback?: string): string | undefined {
  const name = value?.trim() || fallback;
  return name && allowedFieldName.test(name) ? name : undefined;
}

export function readNativeSearchScope(env: NodeJS.ProcessEnv): NativeSearchScope | undefined {
  const nativeIndexId = env.AGLC_SEARCH_INDEX_ID?.trim() ?? '';
  const searchIndexId = normalizeGuid(nativeIndexId);
  const identityField = fieldName(env.AGLC_SEARCH_ID_FIELD, 'sc_item_id');
  const titleField = fieldName(env.AGLC_SEARCH_TITLE_FIELD, 'Title');
  const summaryField = fieldName(env.AGLC_SEARCH_SUMMARY_FIELD);
  const locale = env.AGLC_SEARCH_LOCALE?.trim() || undefined;
  if (!searchIndexId || !identityField || !titleField || (env.AGLC_SEARCH_SUMMARY_FIELD && !summaryField) ||
    (locale && !/^[a-z]{2,3}(?:-[a-zA-Z]{2,8})*$/u.test(locale))) return undefined;
  return { searchIndexId, nativeIndexId, identityField, titleField, summaryField, locale };
}

function readField(doc: Record<string, unknown>, name: string): unknown {
  return Object.hasOwn(doc, name) ? doc[name] : undefined;
}

function plainText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  // Search snippets stay plain text, never markup supplied by the index.
  const clean = value.replace(/[\u0000-\u001f\u007f]/gu, ' ').replace(/<[^>]*>/gu, '').trim();
  return clean ? clean.slice(0, maxLength) : undefined;
}

export async function searchPublishedAglc(
  client: SearchClient,
  scope: NativeSearchScope,
  keyphrase: string,
  signal: AbortSignal,
): Promise<AglcSearchResults> {
  const native = await client.search({
    searchIndexId: scope.nativeIndexId,
    keyphrase,
    limit: nativeResultCap,
    ...(scope.locale ? { locale: scope.locale } : {}),
  }, { signal, cache: 'no-store' });

  if (!Number.isSafeInteger(native.total) || native.total < 0 || native.total > nativeResultCap ||
    !Array.isArray(native.results) || native.results.length !== native.total) {
    throw new Error('Native search did not supply a complete bounded result set');
  }

  const results: AglcSearchResults['results'] = [];
  const seen = new Set<string>();
  for (const hit of native.results) {
    const doc = asRecord(hit);
    const id = doc ? normalizeGuid(readField(doc, scope.identityField)) : undefined;
    // Without a native GUID the integration cannot prove what was returned.
    if (!id || !doc) throw new Error('Native search lacked the configured item identity');
    const published = publishedAglcPages.get(id);
    if (!published || seen.has(id)) continue;
    seen.add(id);
    const title = plainText(readField(doc, scope.titleField), 160) ?? published.fallbackTitle;
    const summary = scope.summaryField ? plainText(readField(doc, scope.summaryField), 300) : undefined;
    results.push({ id, href: published.href, title, ...(summary ? { summary } : {}) });
  }
  return { results, total: results.length };
}
