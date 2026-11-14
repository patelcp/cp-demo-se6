import type { BulkNativeFields } from '../../lib/normalize-native-fields';
import type { NativeProps, ImageValue, TextValue, Children, NavigationItem } from '../../lib/shared-fields';
export type SiteFooterProps = NativeProps<BulkNativeFields & { BrandName?: TextValue; Logo?: ImageValue; Description?: TextValue; Copyright?: TextValue; children?: Children<NavigationItem> }>;
