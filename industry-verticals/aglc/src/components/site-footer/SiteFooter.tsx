import { Text, RichText, Image } from '@sitecore-content-sdk/nextjs';
import { NativeNavigationLink } from '../../lib/native-controls';
import type { SiteFooterProps } from './SiteFooter.props';
export const Default = ({ fields, params }: SiteFooterProps) => {
  const data = fields?.data?.datasource;
  if (!data) return null;
  const groups = new Map<string, NonNullable<NonNullable<typeof data.children>['results']>>();
  for (const item of data.children?.results || []) { const group = item.Group?.jsonValue?.value || ''; groups.set(group, [...(groups.get(group) || []), item]); }
  const hasLogo = Boolean(data.Logo?.jsonValue?.value?.src || data.Logo?.jsonValue?.metadata);
  return <div className={`site-footer ${params.styles || ''}`} id={params.RenderingIdentifier}>
    <div className="shell site-footer__top">
      <div className="site-footer__identity"><Image field={data.Logo?.jsonValue} className="site-footer__logo" /><Text field={data.BrandName?.jsonValue} tag="p" className={hasLogo ? 'visually-hidden' : 'site-footer__brand'} /><RichText field={data.Description?.jsonValue} className="rich-text site-footer__description" /></div>
      <nav className="footer-groups" aria-label="Footer navigation">{Array.from(groups).map(([group, items]) => <div className="footer-group" data-group={group.toLowerCase()} key={group}>{group && <Text field={items[0].Group?.jsonValue} tag="h2" className="footer-group__heading" />}<ul>{items.map(item => <li key={item.id}><NativeNavigationLink item={item} /></li>)}</ul></div>)}</nav>
    </div><div className="site-footer__legal"><div className="shell"><Text field={data.Copyright?.jsonValue} tag="p" className="site-footer__copyright" /></div></div>
  </div>;
};
