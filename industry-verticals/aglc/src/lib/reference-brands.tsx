import type { ComponentRendering, Page } from '@sitecore-content-sdk/nextjs';
import { NativeNavigationLink } from './native-controls';
import type { NavigationItem } from './shared-fields';

// Scope the cutover to the header. A draft component without a resolved datasource
// cannot replace the existing strip yet; an assigned but intentionally empty list can.
export function hasAssignedReferenceBrands(page: Page): boolean {
  const header = page.layout?.sitecore.route?.placeholders['headless-header'] ?? [];
  const hasReferenceBrands = (element: ComponentRendering): boolean =>
    (element.componentName === 'ReferenceBrands' &&
      Boolean(element.dataSource?.trim()) &&
      element.isContentResolved !== false) ||
    Object.values(element.placeholders ?? {}).some(children => children.some(hasReferenceBrands));
  return header.some(hasReferenceBrands);
}

type ReferenceBrandNavProps = {
  items: NavigationItem[];
  styles?: string;
  id?: string;
};

export function ReferenceBrandNav({ items, styles, id }: ReferenceBrandNavProps) {
  if (!items.length) return null;
  return (
    <nav className={styles ? `brand-bar ${styles}` : 'brand-bar'} id={id} aria-label="Related sites">
      <ul>
        {items.map(item => <li key={item.id}><NativeNavigationLink item={item} hideLogoTitle /></li>)}
      </ul>
    </nav>
  );
}
