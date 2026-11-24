import { Text, RichText, Image } from '@sitecore-content-sdk/nextjs';
import { normalizeNativeFields } from '../../lib/normalize-native-fields';
import type { RichTextSectionProps } from './RichTextSection.props';
export const Default = ({ fields, params, page }: RichTextSectionProps) => {
  const data = normalizeNativeFields(fields?.data?.datasource);
  if (!data) return null;
  return <section className="interior-content interior-shell" id={params.RenderingIdentifier}><Text field={data.Heading?.jsonValue} tag="h2" /><RichText field={data.Body?.jsonValue} className="rich-text" />{(data.Image?.jsonValue?.value?.src || page.mode.isEditing) && <Image field={data.Image?.jsonValue} />}</section>;
};
