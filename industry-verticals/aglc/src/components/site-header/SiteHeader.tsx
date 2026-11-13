'use client';
import { useId, useRef, useState } from 'react';
import { Text, Image, Link } from '@sitecore-content-sdk/nextjs';
import type { SiteHeaderProps } from './SiteHeader.props';
export const Default = ({ fields, params }: SiteHeaderProps) => {
  const data = fields?.data?.datasource;
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const button = useRef<HTMLButtonElement>(null);
  if (!data) return null;
  const brand = <><Image field={data.Logo?.jsonValue} className="site-brand__logo" /><Text field={data.BrandName?.jsonValue} tag="span" /></>;
  return <div className={`site-header ${params.styles || ''}`} id={params.RenderingIdentifier} onKeyDown={(event) => { if (event.key === 'Escape' && open) { setOpen(false); button.current?.focus(); } }}>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <div className="shell site-header__inner">
      <div className="site-brand">{(data.HomeLink?.jsonValue?.value?.href || data.HomeLink?.jsonValue?.metadata) ? <Link field={data.HomeLink.jsonValue}>{brand}</Link> : brand}</div>
      <button ref={button} className="menu-toggle" type="button" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(!open)}>{open ? 'Close menu' : 'Menu'}<span aria-hidden="true">{open ? ' −' : ' +'}</span></button>
      <nav id={menuId} className="site-nav" data-open={open} aria-label="Main navigation"><ul>{data.children?.results?.map(item => <li key={item.id}>{item.Link?.jsonValue && <Link field={item.Link.jsonValue} onClick={() => setOpen(false)}>{(item.Title?.jsonValue?.value?.trim() || item.Title?.jsonValue?.metadata) ? <Text field={item.Title?.jsonValue} /> : undefined}</Link>}</li>)}</ul></nav>
    </div>
  </div>;
};
