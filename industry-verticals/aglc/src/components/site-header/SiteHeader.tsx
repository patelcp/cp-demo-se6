'use client';
import { useId, useRef, useState } from 'react';
import { Text, Image, Link } from '@sitecore-content-sdk/nextjs';
import { NativeNavigationLink, NativeSearch } from '../../lib/native-controls';
import type { SiteHeaderProps } from './SiteHeader.props';
export const Default = ({ fields, params, page }: SiteHeaderProps) => {
  const data = fields?.data?.datasource;
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const button = useRef<HTMLButtonElement>(null);
  if (!data) return null;
  const items = data.children?.results || [];
  const brands = items.filter(item => item.Group?.jsonValue?.value?.toLowerCase() === 'brand');
  const utility = items.filter(item => item.Group?.jsonValue?.value?.toLowerCase() === 'utility');
  const main = items.filter(item => !['brand', 'utility'].includes(item.Group?.jsonValue?.value?.toLowerCase() || ''));
  const hasLogo = Boolean(data.Logo?.jsonValue?.value?.src || data.Logo?.jsonValue?.metadata);
  const brand = <><Image field={data.Logo?.jsonValue} className="site-brand__logo" /><Text field={data.BrandName?.jsonValue} tag="span" className={hasLogo ? 'visually-hidden' : undefined} /></>;
  return <div className={`site-header ${params.styles || ''}`} id={params.RenderingIdentifier} onKeyDown={(event) => { if (event.key === 'Escape' && open) { setOpen(false); button.current?.focus(); } }}>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    {brands.length > 0 && <nav className="brand-bar" aria-label="Related sites"><ul>{brands.map(item => <li key={item.id}><NativeNavigationLink item={item} /></li>)}</ul></nav>}
    <div className="site-header__inner">
      <div className="site-brand">{(data.HomeLink?.jsonValue?.value?.href || data.HomeLink?.jsonValue?.metadata) ? <Link field={data.HomeLink.jsonValue}>{brand}</Link> : brand}</div>
      <button ref={button} className="menu-toggle" type="button" aria-label={open ? 'Close menu' : 'Menu'} aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(!open)}><span className="menu-toggle__lines" aria-hidden="true" /></button>
      <div id={menuId} className="header-navigation" data-open={open}>
        <nav className="site-nav" aria-label="Main navigation"><ul>{main.map(item => <li key={item.id}><NativeNavigationLink item={item} onClick={() => setOpen(false)} /></li>)}</ul></nav>
        {utility.length > 0 && <nav className="utility-nav" aria-label="Utility navigation"><ul>{utility.map(item => <li key={item.id}><NativeNavigationLink item={item} onClick={() => setOpen(false)} /></li>)}</ul></nav>}
        <NativeSearch fields={data} editing={page.mode.isEditing} />
      </div>
    </div>
  </div>;
};
