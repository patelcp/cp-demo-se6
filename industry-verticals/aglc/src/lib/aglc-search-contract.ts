/** Shared, data-free UI/transport contract for the AGLC demo's native search. */
export const searchPath = '/search-results';
export const searchEndpoint = '/api/aglc-search';
export const searchQueryParam = 'q';
export const maxQueryLength = 100;

export interface AglcSearchResult {
  id: string;
  title: string;
  summary?: string;
  href: string;
}

export interface AglcSearchResults {
  results: AglcSearchResult[];
  total: number;
}

export function normalizeSearchQuery(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > maxQueryLength || /[\u0000-\u001f\u007f]/u.test(value)) {
    return undefined;
  }
  return value.trim();
}

export function normalizeGuid(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  const plain = trimmed.startsWith('{') && trimmed.endsWith('}') ? trimmed.slice(1, -1) : trimmed;
  if (!/^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(plain)) {
    return undefined;
  }
  return plain.toLowerCase().replaceAll('-', '');
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function resolveSearchDestination(href: string, queryName: string) {
  if (href === searchPath && queryName === searchQueryParam) {
    return { action: searchPath, params: [] as [string, string][] };
  }
  try {
    const destination = new URL(href);
    if (destination.protocol !== 'https:' || destination.username || destination.password) return undefined;
    return {
      action: destination.origin + destination.pathname,
      params: [...destination.searchParams].filter(([name]) => name !== queryName),
    };
  } catch {
    return undefined;
  }
}
