import { normalizeNativeFields } from '../../lib/normalize-native-fields';
import { ReferenceBrandNav } from '../../lib/reference-brands';
import type { Children, NativeProps, NavigationItem } from '../../lib/shared-fields';

type ReferenceBrandsProps = NativeProps<{ children?: Children<NavigationItem> }>;

export const Default = ({ fields, params, page }: ReferenceBrandsProps) => {
  const data = normalizeNativeFields(fields?.data?.datasource);
  const items = data?.children?.results ?? [];

  if (!items.length && page.mode.isEditing) {
    return (
      <div className="brand-bar brand-bar--editor-empty">
        {data ? 'Add a brand link using Manage items.' : 'Assign the shared Reference Brands content item.'}
      </div>
    );
  }

  return <ReferenceBrandNav items={items} styles={params.styles} id={params.RenderingIdentifier} />;
};
