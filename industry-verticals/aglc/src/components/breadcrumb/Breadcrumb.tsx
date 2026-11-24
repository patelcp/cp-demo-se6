import { Link, Text } from '@sitecore-content-sdk/nextjs';
import { normalizeNativeFields } from '../../lib/normalize-native-fields';
import type { BreadcrumbProps } from './Breadcrumb.props';
export const Default = ({ fields, params, page }: BreadcrumbProps) => {
  const data = normalizeNativeFields(fields?.data?.datasource);
  if (!data) return null;
  return <nav className="interior-breadcrumb" aria-label="Breadcrumb" id={params.RenderingIdentifier}><ol className="interior-shell">{data.children?.results?.map((item, index, items) => <li key={item.id} aria-current={index === items.length - 1 ? 'page' : undefined}>{item.Link?.jsonValue?.value?.href || (page.mode.isEditing && item.Link?.jsonValue?.metadata) ? <Link field={item.Link?.jsonValue}>{item.Title?.jsonValue?.value || item.Title?.jsonValue?.metadata ? <Text field={item.Title.jsonValue} /> : undefined}</Link> : <Text field={item.Title?.jsonValue} />}</li>)}</ol></nav>;
};
