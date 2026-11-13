import { Text, RichText, Link } from '@sitecore-content-sdk/nextjs';
import type { CallToActionProps } from './CallToAction.props';
export const Default = ({ fields, params }: CallToActionProps) => {
  const data = fields?.data?.datasource;
  if (!data) return null;
  return <section className={`cta-section shell ${params.styles || ''}`} id={params.RenderingIdentifier}><div className="cta-panel"><div><Text field={data.Title?.jsonValue} tag="h2" /><RichText field={data.Body?.jsonValue} className="rich-text" /></div>{data.Link?.jsonValue && <Link field={data.Link.jsonValue} className="button" />}</div></section>;
};
