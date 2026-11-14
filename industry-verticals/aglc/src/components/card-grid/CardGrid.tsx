import { Text, RichText, Image, Link } from '@sitecore-content-sdk/nextjs';
import type { CardGridProps } from './CardGrid.props';
export const Default = ({ fields, params, page }: CardGridProps) => {
  const data = fields?.data?.datasource;
  if (!data) return null;
  return <section className={`card-section shell ${params.styles || ''}`} id={params.RenderingIdentifier}>
    <div className="section-intro"><Text field={data.Heading?.jsonValue} tag="h2" /><RichText field={data.Intro?.jsonValue} className="rich-text" /></div>
    <div className="card-grid">{data.children?.results?.map(item => <article className="content-card" key={item.id}>
      {(item.Image?.jsonValue?.value?.src || page.mode.isEditing) && <div className="content-card__media"><Image field={item.Image?.jsonValue} /></div>}
      <div className="content-card__body"><h3>{item.Link?.jsonValue ? <Link field={item.Link.jsonValue} className="content-card__link">{(item.Title?.jsonValue?.value?.trim() || item.Title?.jsonValue?.metadata) ? <Text field={item.Title.jsonValue} /> : undefined}</Link> : <Text field={item.Title?.jsonValue} />}</h3><RichText field={item.Summary?.jsonValue} className="rich-text" /></div>
    </article>)}</div>
  </section>;
};
