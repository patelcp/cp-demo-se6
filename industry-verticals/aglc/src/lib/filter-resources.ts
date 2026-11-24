import type { ResourceItem } from '../components/resource-list/ResourceList.props';
export function filterResources(items: ResourceItem[], query: string, category: string, documentType: string): ResourceItem[] {
  const needle = query.trim().toLowerCase();
  return items.filter(item => (!category || item.Category?.jsonValue?.value?.trim() === category) &&
    (!documentType || item.DocumentType?.jsonValue?.value?.trim() === documentType) &&
    (!needle || [item.Title?.jsonValue?.value, item.Summary?.jsonValue?.value].some(value => value?.replace(/<[^>]*>/g, ' ').toLowerCase().includes(needle))));
}
