import { SearchService } from '@sitecore-content-sdk/search';
import { handleAglcSearch } from '../../../lib/aglc-search-handler';
import { isLiveAglcSearchOnHost } from '../../../lib/aglc-search-fallback';

export const runtime = 'nodejs';

export function POST(request: Request): Promise<Response> {
  if (process.env.VERCEL_ENV === 'production' &&
    !isLiveAglcSearchOnHost({ site: 'aglc', locale: 'en' }, request.headers.get('host'), process.env)) {
    return Promise.resolve(Response.json({ error: 'search_unavailable' }, {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
    }));
  }
  return handleAglcSearch(request, process.env, (contextId) => new SearchService({ contextId }));
}
