import { SearchService } from '@sitecore-content-sdk/search';
import { handleAglcSearch } from '../../../lib/aglc-search-handler';

export const runtime = 'nodejs';

export function POST(request: Request): Promise<Response> {
  return handleAglcSearch(request, process.env, (contextId) => new SearchService({ contextId }));
}
