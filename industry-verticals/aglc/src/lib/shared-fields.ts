import type { Field, FieldMetadata, ImageField, LinkField } from '@sitecore-content-sdk/nextjs';
import type { ComponentProps } from './component-props';
export type TextValue = { jsonValue: Field<string> };
export type ImageValue = { jsonValue: ImageField & FieldMetadata };
export type LinkValue = { jsonValue: LinkField & FieldMetadata };
export type NavigationItem = { id: string; Title?: TextValue; Link?: LinkValue; Group?: TextValue; Logo?: ImageValue };
export type Children<T> = { results?: T[] };
export type NativeProps<T> = ComponentProps & { fields?: { data?: { datasource?: T | null } } };
export type SearchFields = { SearchAction?: LinkValue; SearchLabel?: TextValue; SearchQueryName?: TextValue };
