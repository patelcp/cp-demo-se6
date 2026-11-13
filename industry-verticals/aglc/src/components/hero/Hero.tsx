import { Text, RichText, Image, Link } from '@sitecore-content-sdk/nextjs';
import type { HeroProps } from './Hero.props';
export const Default = ({ fields, params, page }: HeroProps) => {
  const data = fields?.data?.datasource;
  if (!data) return null;
  const hasImage = Boolean(data.Image?.jsonValue?.value?.src || page.mode.isEditing);
  return <section className={`hero ${params.styles || ''}`} id={params.RenderingIdentifier}><div className="shell hero__inner" data-has-image={hasImage}>
    <div className="hero__copy"><Text field={data.Eyebrow?.jsonValue} tag="p" className="eyebrow" /><Text field={data.Title?.jsonValue} tag="h1" /><RichText field={data.Summary?.jsonValue} className="rich-text hero__summary" />
      <div className="actions">{data.PrimaryLink?.jsonValue && <Link field={data.PrimaryLink.jsonValue} className="button" />}{data.SecondaryLink?.jsonValue && <Link field={data.SecondaryLink.jsonValue} className="button button--secondary" />}</div>
    </div>{hasImage && <div className="hero__media"><Image field={data.Image?.jsonValue} className="hero__image" /></div>}
  </div></section>;
};
