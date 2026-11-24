import type { BulkNativeFields } from '../../lib/normalize-native-fields';
import type { NativeProps, TextValue, LinkValue, Children } from '../../lib/shared-fields';
export type ResourceItem = BulkNativeFields & { id: string; Title?: TextValue; Summary?: TextValue; Link?: LinkValue; Category?: TextValue; DocumentType?: TextValue };
export type ResourceListProps = NativeProps<BulkNativeFields & { Heading?: TextValue; Intro?: TextValue; children?: Children<ResourceItem> }>;
