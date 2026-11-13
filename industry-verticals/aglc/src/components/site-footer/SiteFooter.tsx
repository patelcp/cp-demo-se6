import { Text, RichText, Link } from '@sitecore-content-sdk/nextjs';
import type { SiteFooterProps } from './SiteFooter.props';
export const Default = ({ fields, params }: SiteFooterProps) => {
  const data = fields?.data?.datasource;
  if (!data) return null;
  return <div className={`site-footer ${params.styles || ''}`} id={params.RenderingIdentifier}><div className="shell">
    <div className="site-footer__top"><div><Text field={data.BrandName?.jsonValue} tag="p" className="site-footer__brand" /><RichText field={data.Description?.jsonValue} className="rich-text site-footer__description" /></div>
    <nav aria-label="Footer navigation"><ul>{data.children?.results?.map(item => <li key={item.id}>{item.Link?.jsonValue && <Link field={item.Link.jsonValue}>{(item.Title?.jsonValue?.value?.trim() || item.Title?.jsonValue?.metadata) ? <Text field={item.Title?.jsonValue} /> : undefined}</Link>}</li>)}</ul></nav></div>
    <Text field={data.Copyright?.jsonValue} tag="p" className="site-footer__copyright" />
  </div></div>;
};
