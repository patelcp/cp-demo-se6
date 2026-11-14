import type { BulkNativeFields } from '../../lib/normalize-native-fields';
import type { NativeProps, ImageValue, TextValue, LinkValue } from '../../lib/shared-fields';
export type CallToActionProps = NativeProps<BulkNativeFields & { Title?: TextValue; Image?: ImageValue; Body?: TextValue; Link?: LinkValue }>;
