import { Image, Link, Text } from '@sitecore-content-sdk/nextjs';
import type { NavigationItem, SearchFields } from './shared-fields';

export function NativeNavigationLink({ item, onClick }: { item: NavigationItem; onClick?: () => void }) {
  if (!item.Link?.jsonValue) return null;
  const hasLogo = Boolean(item.Logo?.jsonValue?.value?.src || item.Logo?.jsonValue?.metadata);
  const brandLogo = item.Group?.jsonValue?.value?.toLowerCase() === 'brand';
  const hasTitle = Boolean(item.Title?.jsonValue?.value?.trim() || item.Title?.jsonValue?.metadata);
  return <Link field={item.Link.jsonValue} onClick={onClick}>
    {hasLogo ? <><Image field={item.Logo?.jsonValue} /><Text field={item.Title?.jsonValue} tag="span" className={brandLogo ? 'visually-hidden' : undefined} /></> : hasTitle ? <Text field={item.Title?.jsonValue} /> : undefined}
  </Link>;
}

export function NativeSearch({ fields, editing = false }: { fields: SearchFields; editing?: boolean }) {
  const action = fields.SearchAction?.jsonValue;
  const label = fields.SearchLabel?.jsonValue;
  const queryName = fields.SearchQueryName?.jsonValue?.value;
  if (editing) return <div className="native-search-editor"><Text field={label} />{action && <Link field={action} />}<Text field={fields.SearchQueryName?.jsonValue} /></div>;
  if (!action?.value?.href || !label?.value?.trim() || !queryName?.match(/^[a-zA-Z][a-zA-Z0-9_-]*$/)) return null;
  // CMS controls the real external search endpoint; never imply Sitecore Search.
  let destination: URL;
  try { destination = new URL(action.value.href); } catch { return null; }
  if (destination.protocol !== 'https:') return null;
  return <form className="native-search" role="search" action={destination.origin + destination.pathname} method="get" aria-label={label.value}>
    {Array.from(destination.searchParams).filter(([name]) => name !== queryName).map(([name, value], index) => <input key={`${name}-${index}`} type="hidden" name={name} value={value} />)}
    <button type="submit" aria-label={label.value}><span className="search-icon" aria-hidden="true" /></button>
    <input type="search" name={queryName} placeholder={label.value} aria-label={label.value} required />
  </form>;
}
