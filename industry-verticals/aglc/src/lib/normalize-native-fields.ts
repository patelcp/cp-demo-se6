/**
 * Adapt Sitecore's bulk fields projection to the established component aliases.
 * Field objects are passed through by reference, including all editing metadata.
 * No content defaults, value conversion or synthetic fields are introduced.
 */
const allowedFields = new Set([
  'BrandName', 'Logo', 'HomeLink', 'Description', 'Copyright',
  'Eyebrow', 'Title', 'Summary', 'Image', 'PrimaryLink', 'SecondaryLink',
  'BackgroundImage', 'BackgroundVideo', 'SearchAction', 'SearchLabel',
  'SearchQueryName', 'Heading', 'Intro', 'Body', 'Link', 'Group',
]);

export type NativeFieldProjection = { name: string; jsonValue: unknown };
export type BulkNativeFields = { Fields?: NativeFieldProjection[] };
const owns = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function normalizeItem(input: Record<string, unknown>, includeChildren: boolean): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  // Existing aliases take precedence. Do not spread untrusted field names or objects.
  for (const name of allowedFields) {
    if (owns(input, name)) output[name] = input[name];
  }
  if (owns(input, 'id') && typeof input.id === 'string') output.id = input.id;
  if (owns(input, 'Fields') && Array.isArray(input.Fields)) {
    for (const field of input.Fields) {
      if (!record(field) || !owns(field, 'name') || typeof field.name !== 'string' ||
          !allowedFields.has(field.name) || !owns(field, 'jsonValue') || owns(output, field.name)) continue;
      output[field.name] = { jsonValue: field.jsonValue };
    }
  }
  if (includeChildren && owns(input, 'children') && record(input.children) &&
      owns(input.children, 'results') && Array.isArray(input.children.results)) {
    output.children = {
      results: input.children.results.filter(record).map(child => normalizeItem(child, false)),
    };
  }
  return output;
}

export function normalizeNativeFields<T>(input: T): T {
  if (!record(input)) return input;
  return normalizeItem(input, true) as T;
}
