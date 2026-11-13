import type { NativeProps, TextValue, ImageValue, LinkValue, Children } from '../../lib/shared-fields';
export type CardItem = { id: string; Title?: TextValue; Summary?: TextValue; Image?: ImageValue; Link?: LinkValue };
export type CardGridProps = NativeProps<{ Heading?: TextValue; Intro?: TextValue; children?: Children<CardItem> }>;
