'use client';
import { filterResources } from '../../lib/filter-resources';
import { useId, useState } from 'react';
import { Text, RichText, Link } from '@sitecore-content-sdk/nextjs';
import { normalizeNativeFields } from '../../lib/normalize-native-fields';
import type { ResourceListProps, ResourceItem } from './ResourceList.props';
function ResourceTitle({ item }: { item: ResourceItem }) {
  return item.Link?.jsonValue?.value?.href || item.Link?.jsonValue?.metadata ? <Link field={item.Link.jsonValue}>{item.Title?.jsonValue?.value?.trim() || item.Title?.jsonValue?.metadata ? <Text field={item.Title.jsonValue} /> : undefined}</Link> : <Text field={item.Title?.jsonValue} />;
}
function Resources({ fields, params, page, documents = false }: ResourceListProps & { documents?: boolean }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [documentType, setDocumentType] = useState('');
  const data = normalizeNativeFields(fields?.data?.datasource);
  if (!data) return null;
  const items = data.children?.results || [];
  const options = (key: 'Category' | 'DocumentType') => [...new Set(items.map(item => item[key]?.jsonValue?.value?.trim()).filter((value): value is string => Boolean(value)))];
  const visible = documents && !page.mode.isEditing ? filterResources(items, query, category, documentType) : items;
  return <section className={`resource-list${documents ? ' resource-list--documents' : ''}`} id={params.RenderingIdentifier}><div className="interior-shell"><Text field={data.Heading?.jsonValue} tag="h2" /><RichText field={data.Intro?.jsonValue} className="rich-text" />
    {documents && !page.mode.isEditing && <><p className="resource-list__scope">Filter this demo’s authored document selection, not the full AGLC catalogue.</p><div className="resource-filters"><label htmlFor={`${id}-search`}>Search<input id={`${id}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} /></label><label htmlFor={`${id}-category`}>Category<select id={`${id}-category`} value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{options('Category').map(value => <option key={value}>{value}</option>)}</select></label><label htmlFor={`${id}-type`}>Document type<select id={`${id}-type`} value={documentType} onChange={event => setDocumentType(event.target.value)}><option value="">All document types</option>{options('DocumentType').map(value => <option key={value}>{value}</option>)}</select></label></div><p role="status">{visible.length} documents shown</p></>}
    <ul className="resource-items">{visible.map(item => <li key={item.id}>{documents && <div className="resource-item__meta"><Text field={item.Category?.jsonValue} /><Text field={item.DocumentType?.jsonValue} /></div>}<h3><ResourceTitle item={item} /></h3><RichText field={item.Summary?.jsonValue} className="rich-text" /></li>)}</ul>
    {documents && !visible.length && <p>No matching documents in this selection.</p>}
  </div></section>;
}
export const Default = (props: ResourceListProps) => <Resources {...props} />;
export const Documents = (props: ResourceListProps) => <Resources {...props} documents />;
