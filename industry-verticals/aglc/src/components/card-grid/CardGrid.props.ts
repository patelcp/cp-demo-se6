import type { BulkNativeFields } from '../../lib/normalize-native-fields';
import type { NativeProps, TextValue, ImageValue, LinkValue, Children } from '../../lib/shared-fields';
export type CardItem = { id: string; Title?: TextValue; Summary?: TextValue; Image?: ImageValue; Link?: LinkValue };
export type CardGridProps = NativeProps<BulkNativeFields & { Heading?: TextValue; Intro?: TextValue; children?: Children<CardItem> }>;
