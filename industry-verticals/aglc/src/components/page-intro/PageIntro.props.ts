import type { BulkNativeFields } from '../../lib/normalize-native-fields';
import type { NativeProps, TextValue, ImageValue } from '../../lib/shared-fields';
export type PageIntroProps = NativeProps<BulkNativeFields & { Title?: TextValue; Summary?: TextValue; Image?: ImageValue }>;
