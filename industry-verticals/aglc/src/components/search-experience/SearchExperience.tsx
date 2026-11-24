'use client';

import { Suspense, useEffect, useId, useState } from 'react';
import type { Field, Page } from '@sitecore-content-sdk/nextjs';
import { Text } from '@sitecore-content-sdk/nextjs';
import { useSearchParams } from 'next/navigation';
import {
  asRecord,
  maxQueryLength,
  normalizeGuid,
  normalizeSearchQuery,
  searchEndpoint,
  searchPath,
  searchQueryParam,
} from '../../lib/aglc-search-contract';
import type { AglcSearchResults } from '../../lib/aglc-search-contract';

type SearchExperienceProps = { fields?: { search?: Field<string> }; page: Page };
type ResultState = { kind: 'loading' | 'unavailable' } | { kind: 'ready'; payload: AglcSearchResults };

function getIndexId(field: Field<string> | undefined): string | undefined {
  if (!field?.value) return undefined;
  try {
    const config = asRecord(JSON.parse(field.value));
    return normalizeGuid(config?.searchIndex);
  } catch {
    return undefined;
  }
}

function ResultList({ indexId, query }: { indexId: string; query: string }) {
  const [state, setState] = useState<ResultState>({ kind: 'loading' });
  useEffect(() => {
    const abort = new AbortController();
    void (async () => {
      try {
        const response = await fetch(searchEndpoint, {
          method: 'POST',
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ indexId, query }),
          signal: abort.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Search unavailable');
        const payload = (await response.json()) as AglcSearchResults;
        if (!abort.signal.aborted) setState({ kind: 'ready', payload });
      } catch {
        if (!abort.signal.aborted) setState({ kind: 'unavailable' });
      }
    })();
    return () => abort.abort();
  }, [indexId, query]);

  if (state.kind === 'loading') return <p role="status">Searching AGLC…</p>;
  if (state.kind === 'unavailable') {
    return <p role="status">Search isn’t available right now. Try again or browse Gaming, Liquor, Cannabis, or Forms and documents from the site navigation.</p>;
  }
  if (state.kind === 'ready' && state.payload.total === 0) {
    return <p role="status">No AGLC results found. Try a different search term.</p>;
  }
  if (state.kind !== 'ready') return null;
  const { total, results } = state.payload;
  return (
    <div className="aglc-search-results__matches">
      <p role="status">{total} {total === 1 ? 'result' : 'results'}</p>
      <ul>
        {results.map(({ id, title, summary, href }) => (
          <li key={id}>
            <a href={href}>{title}</a>
            {summary && <p>{summary}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchPanel({ indexId }: { indexId: string }) {
  const params = useSearchParams();
  const inputId = useId();
  const supplied = params.getAll(searchQueryParam);
  const query = supplied.length <= 1 ? normalizeSearchQuery(supplied[0] ?? '') : undefined;
  return (
    <>
      <form action={searchPath} method="get" role="search" aria-label="Search AGLC results" className="aglc-search-results__form">
        <label htmlFor={inputId}>Search AGLC</label>
        <div>
          <input id={inputId} type="search" name={searchQueryParam} defaultValue={query ?? ''} maxLength={maxQueryLength} required />
          <button type="submit" className="button">Search</button>
        </div>
      </form>
      {query === undefined && <p role="status">Enter a single search term of up to {maxQueryLength} characters.</p>}
      {query === '' && <p>Try forms, liquor, gaming, or cannabis.</p>}
      {query && <ResultList key={`${indexId}:${query}`} indexId={indexId} query={query} />}
    </>
  );
}

export function Default({ fields, page }: SearchExperienceProps) {
  if (page.siteName?.toLowerCase() !== 'aglc') return null;
  if (page.mode.isEditing || page.mode.isPreview) {
    return (
      <section className="aglc-search-results interior-shell" aria-label="Search AGLC">
        <p>Live search is disabled in Page Builder and Preview. Run tests only on the published demo route.</p>
        {page.mode.isEditing && fields?.search && <Text field={fields.search} editable={false} tag="code" />}
      </section>
    );
  }
  const indexId = getIndexId(fields?.search);
  if (!indexId) return <p className="aglc-search-results interior-shell" role="status">Search isn’t available right now.</p>;
  return (
    <section className="aglc-search-results interior-shell" aria-label="Search AGLC">
      <Suspense fallback={<p role="status">Loading search…</p>}>
        <SearchPanel indexId={indexId} />
      </Suspense>
    </section>
  );
}
