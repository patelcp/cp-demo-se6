import type { BulkNativeFields } from '../../lib/normalize-native-fields';
import type { NativeProps, TextValue, ImageValue } from '../../lib/shared-fields';
export type RichTextSectionProps = NativeProps<BulkNativeFields & { Heading?: TextValue; Body?: TextValue; Image?: ImageValue }>;
