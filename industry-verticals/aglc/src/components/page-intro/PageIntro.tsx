import { Text, RichText, Image } from '@sitecore-content-sdk/nextjs';
import { normalizeNativeFields } from '../../lib/normalize-native-fields';
import type { PageIntroProps } from './PageIntro.props';
function Intro({ fields, params, page, banner = false }: PageIntroProps & { banner?: boolean }) {
  const data = normalizeNativeFields(fields?.data?.datasource);
  if (!data) return null;
  const image = Boolean(data.Image?.jsonValue?.value?.src || page.mode.isEditing);
  return <section className={`page-intro${banner ? ' page-intro--image' : ''}`} id={params.RenderingIdentifier}>
    {banner && image && <div className="page-intro__background"><Image field={data.Image?.jsonValue} /></div>}
    <div className="interior-shell page-intro__copy"><Text field={data.Title?.jsonValue} tag="h1" /><RichText field={data.Summary?.jsonValue} className="rich-text" /></div>
  </section>;
}
export const Default = (props: PageIntroProps) => <Intro {...props} />;
export const ImageBanner = (props: PageIntroProps) => <Intro {...props} banner />;
