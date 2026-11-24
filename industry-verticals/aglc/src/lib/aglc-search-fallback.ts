import { normalizeGuid, searchPath } from './aglc-search-contract';

interface RouteScope {
  site: string;
  locale: string;
  path?: string[];
}

const publicAglcHost = 'aglc-cp.vercel.app';
const publicHosts = new Set([publicAglcHost, 'cannabissense-cp.vercel.app']);
const hostShape = /^[a-z0-9][a-z0-9.-]*(?::[1-9][0-9]{0,4})?$/u;

export function mayCheckLiveAglcSearch({ site, locale }: RouteScope, env: NodeJS.ProcessEnv): boolean {
  return site === 'aglc' && locale === 'en' && env.AGLC_NATIVE_SEARCH_LIVE === '1' &&
    env.VERCEL_ENV === 'production' && Boolean(normalizeGuid(env.AGLC_SEARCH_INDEX_ID)) &&
    Boolean(env.AGLC_SEARCH_CONTEXT_ID?.trim() || env.SITECORE_EDGE_CONTEXT_ID?.trim() ||
      env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID?.trim());
}

export function isLiveAglcSearchOnHost(scope: RouteScope, requestHost: string | null, env: NodeJS.ProcessEnv): boolean {
  return mayCheckLiveAglcSearch(scope, env) && requestHost?.toLowerCase() === publicAglcHost;
}

export function mayCheckSearchFallback({ site, locale, path }: RouteScope, env: NodeJS.ProcessEnv) {
  return site === 'aglc' && locale === 'en' && path?.length === 1 &&
    `/${path[0]}` === searchPath && Boolean(normalizeGuid(env.AGLC_SEARCH_INDEX_ID));
}

export function getSearchFallbackIndex(
  scope: RouteScope,
  requestHost: string | null,
  env: NodeJS.ProcessEnv,
): string | undefined {
  if (!mayCheckSearchFallback(scope, env) || !requestHost) return undefined;
  if (isLiveAglcSearchOnHost(scope, requestHost, env)) return normalizeGuid(env.AGLC_SEARCH_INDEX_ID);
  const expected = (env.AGLC_SEARCH_FALLBACK_HOST ||
    (env.AGLC_SEARCH_FALLBACK_USE_VERCEL_URL === '1' && env.VERCEL_ENV === 'preview' ? env.VERCEL_URL : ''))
    ?.trim().toLowerCase();
  if (!expected || !hostShape.test(expected) || publicHosts.has(expected.split(':')[0]) ||
    requestHost.toLowerCase() !== expected) return undefined;
  return normalizeGuid(env.AGLC_SEARCH_INDEX_ID);
}
