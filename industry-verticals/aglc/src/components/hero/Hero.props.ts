import type { BulkNativeFields } from '../../lib/normalize-native-fields';
import type { NativeProps, SearchFields, TextValue, ImageValue, LinkValue, Children, NavigationItem } from '../../lib/shared-fields';
export type HeroProps = NativeProps<BulkNativeFields & SearchFields & { Eyebrow?: TextValue; Title?: TextValue; Summary?: TextValue; Image?: ImageValue; PrimaryLink?: LinkValue; SecondaryLink?: LinkValue; BackgroundImage?: ImageValue; BackgroundVideo?: LinkValue; children?: Children<NavigationItem> }>;
