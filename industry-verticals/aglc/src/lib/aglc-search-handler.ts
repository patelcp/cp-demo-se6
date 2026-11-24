import { asRecord, normalizeGuid, normalizeSearchQuery } from './aglc-search-contract';
import { readNativeSearchScope, searchPublishedAglc } from './aglc-search-server';

const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const maxBodySize = 1024;

async function readBody(request: Request): Promise<unknown> {
  const length = request.headers.get('content-length');
  const media = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (media !== 'application/json' || Number(length) > maxBodySize || !request.body) return undefined;
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let text = '';
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBodySize) {
        void reader.cancel().catch(() => undefined);
        return undefined;
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {
    return undefined;
  } finally {
    reader.releaseLock();
  }
}

type NativeSearchClient = Parameters<typeof searchPublishedAglc>[0];

export async function handleAglcSearch(
  request: Request,
  env: NodeJS.ProcessEnv,
  getClient: (contextId: string) => NativeSearchClient,
): Promise<Response> {
  const body = asRecord(await readBody(request));
  const query = normalizeSearchQuery(body?.query);
  const requestedSource = normalizeGuid(body?.indexId);
  if (!query || !requestedSource) {
    return Response.json({ error: 'invalid_request' }, { status: 400, headers });
  }
  const scope = readNativeSearchScope(env);
  const contextId = env.AGLC_SEARCH_CONTEXT_ID?.trim() ||
    env.SITECORE_EDGE_CONTEXT_ID?.trim() || env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID?.trim();
  if (!scope || !contextId || requestedSource !== scope.searchIndexId) {
    return Response.json({ error: 'search_unavailable' }, { status: 503, headers });
  }
  try {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(6000)]);
    return Response.json(await searchPublishedAglc(getClient(contextId), scope, query, signal), { headers });
  } catch {
    // Do not return or log raw query text, other-site index payloads, or vendor error messages.
    return Response.json({ error: 'search_unavailable' }, { status: 503, headers });
  }
}
