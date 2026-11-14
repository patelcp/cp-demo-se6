import { normalizeNativeFields } from '../../lib/normalize-native-fields';
import { Text, RichText, Link, Image } from '@sitecore-content-sdk/nextjs';
import type { CallToActionProps } from './CallToAction.props';
export const Default = ({ fields, params, page }: CallToActionProps) => {
  const data = fields?.data?.datasource;
  if (!data) return null;
  const hasImage = Boolean(data.Image?.jsonValue?.value?.src || page.mode.isEditing);
  return <section className={`cta-section ${params.styles || ''}`} id={params.RenderingIdentifier}><div className="shell"><div className="cta-panel" data-has-image={hasImage}><div className="cta-panel__copy"><Text field={data.Title?.jsonValue} tag="h2" /><RichText field={data.Body?.jsonValue} className="rich-text" />{data.Link?.jsonValue && <Link field={data.Link.jsonValue} className="button" />}</div>{hasImage && <div className="cta-panel__image"><Image field={data.Image?.jsonValue} /></div>}</div></div></section>;
};

/** Centered topic hand-off band for interior pages; Home keeps Default. */
export const TopicBand = ({ fields, params }: CallToActionProps) => {
  const data = normalizeNativeFields(fields?.data?.datasource);
  if (!data) return null;
  return <section className="topic-band" id={params.RenderingIdentifier}><div className="interior-shell"><Text field={data.Title?.jsonValue} tag="h2" /><RichText field={data.Body?.jsonValue} className="rich-text" />{(data.Link?.jsonValue?.value?.href || data.Link?.jsonValue?.metadata) && <Link field={data.Link.jsonValue} className="button" />}</div></section>;
};
