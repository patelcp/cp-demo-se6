import type { BulkNativeFields } from '../../lib/normalize-native-fields';
import type { NativeProps, Children, NavigationItem } from '../../lib/shared-fields';
export type BreadcrumbProps = NativeProps<BulkNativeFields & { children?: Children<NavigationItem> }>;
