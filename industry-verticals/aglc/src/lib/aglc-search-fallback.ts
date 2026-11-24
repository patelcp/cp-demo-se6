import { normalizeGuid, searchPath } from './aglc-search-contract';

interface RouteScope {
  site: string;
  locale: string;
  path?: string[];
}

const publicHosts = new Set(['aglc-cp.vercel.app', 'cannabissense-cp.vercel.app']);
const hostShape = /^[a-z0-9][a-z0-9.-]*(?::[1-9][0-9]{0,4})?$/u;

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
  const expected = (env.AGLC_SEARCH_FALLBACK_HOST ||
    (env.AGLC_SEARCH_FALLBACK_USE_VERCEL_URL === '1' && env.VERCEL_ENV === 'preview' ? env.VERCEL_URL : ''))
    ?.trim().toLowerCase();
  if (!expected || !hostShape.test(expected) || publicHosts.has(expected.split(':')[0]) ||
    requestHost.toLowerCase() !== expected) return undefined;
  return normalizeGuid(env.AGLC_SEARCH_INDEX_ID);
}
