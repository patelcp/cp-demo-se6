'use client';

import { AppPlaceholder, ComponentMap, ImageField, NextImage, useSitecore } from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from 'lib/component-props';
import { JSX, useEffect, useRef, type RefObject } from 'react';

function placeMobileMenu(root: HTMLElement) {
  const header = root.closest('header');

  if (!header) {
    return;
  }

  const top = Math.max(0, Math.round(header.getBoundingClientRect().bottom));
  document.documentElement.style.setProperty('--rrh-menu-top', `${top}px`);
}

function useRrhNavToggle(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const input = root.querySelector<HTMLInputElement>('.rrh-nav input[type="checkbox"]');
    const toggle = root.querySelector<HTMLElement>('.rrh-nav-toggle');

    if (!input || !toggle) {
      return;
    }

    toggle.tabIndex = 0;
    toggle.setAttribute('role', 'button');

    const sync = () => {
      const isExpanded = input.checked;
      toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      toggle.setAttribute('aria-label', isExpanded ? 'Close menu' : 'Open menu');
    };

    const placeAfterOpen = () => {
      if (!input.checked) {
        return;
      }

      requestAnimationFrame(() => {
        placeMobileMenu(root);
      });
    };

    const onPointerDown = () => {
      placeMobileMenu(root);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      placeMobileMenu(root);
      input.click();
    };

    const onChange = () => {
      sync();
      placeAfterOpen();
    };

    sync();
    toggle.addEventListener('pointerdown', onPointerDown);
    toggle.addEventListener('keydown', onKeyDown);
    input.addEventListener('change', onChange);

    return () => {
      toggle.removeEventListener('pointerdown', onPointerDown);
      toggle.removeEventListener('keydown', onKeyDown);
      input.removeEventListener('change', onChange);
    };
  }, [rootRef]);
}

export type HeaderProps = ComponentProps & {
  fields: {
    LogoImage: ImageField;
  };
  componentMap: ComponentMap;
};

export const Default = (props: HeaderProps): JSX.Element => {
  const id = props.params.RenderingIdentifier;
  const { page } = useSitecore();
  const headerRef = useRef<HTMLDivElement>(null);
  useRrhNavToggle(headerRef);

  return (
    <div
      ref={headerRef}
      className={`component header ${props.params.styles?.trimEnd()}`}
      id={id ? id : undefined}
    >
      <div className={`container container-${props.params?.ContainerWidth?.toLowerCase()}-fluid`}>
        <div className="row align-items-center">
          <div className="col-auto">
            <AppPlaceholder name="header-left" rendering={props.rendering} page={page} componentMap={props.componentMap} />
          </div>
          <div className="col">
            <AppPlaceholder name="header-right" rendering={props.rendering} page={page} componentMap={props.componentMap} />
          </div>
        </div>
      </div>
    </div>
  );
};



export const WithLogoImage = (props: HeaderProps): JSX.Element => {
  const id = props.params.RenderingIdentifier;
  const sxaStyles = `${props.params?.styles || ''}`;
  const { page } = useSitecore();
  const headerRef = useRef<HTMLDivElement>(null);
  useRrhNavToggle(headerRef);

  return (
    <div ref={headerRef} className={`component header ${sxaStyles}`} id={id ? id : undefined}>
      <div className={`container container-${props.params?.ContainerWidth?.toLowerCase()}-fluid`}>
        <div className="row align-items-center">
          <div className="col-auto">
            <a href="/" className="header-logo">
              <NextImage field={props.fields.LogoImage} width={300} height={76} />
            </a>
          </div>
          <div className="col">
            <AppPlaceholder name="header-right" rendering={props.rendering} page={page} componentMap={props.componentMap} />
          </div>
        </div>
      </div>
    </div>
  );
};
