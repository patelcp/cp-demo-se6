import type { NativeProps, SearchFields, TextValue, ImageValue, LinkValue, Children, NavigationItem } from '../../lib/shared-fields';
export type SiteHeaderProps = NativeProps<SearchFields & { BrandName?: TextValue; Logo?: ImageValue; HomeLink?: LinkValue; children?: Children<NavigationItem> }>;
