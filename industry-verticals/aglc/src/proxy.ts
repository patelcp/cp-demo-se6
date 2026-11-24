import { NextResponse, type NextRequest } from 'next/server';
import {
  defineProxy,
  PreviewProxy,
  AppRouterMultisiteProxy,
  RedirectsProxy,
  LocaleProxy,
} from '@sitecore-content-sdk/nextjs/proxy';
import sites from '.sitecore/sites.json';
import scConfig from 'sitecore.config';
import { routing } from './i18n/routing';
import client from './lib/sitecore-client';
import { CannabisSensePersonalizeProxy } from './lib/cannabissense-personalize-proxy';
import {
  AGLC_HOST, configuredPolicy, consentRemainingSeconds, DEMO_HOST,
  isExternalVariantPath, scopedCookie, SITECORE_COOKIES,
} from './lib/cannabissense-personalization';

const preview = new PreviewProxy({
    client,
    ...scConfig.api.edge,
});

const locale = new LocaleProxy({
  /**
   * List of sites for site resolver to work with
   */
  sites,
  /**
   * List of all supported locales configured in routing.ts
   */
  locales: routing.locales.slice(),
  // This function determines if the middleware should be turned off on per-request basis.
  // Certain paths are ignored by default (e.g. files and Next.js API routes), but you may wish to disable more.
  // This is an important performance consideration since Next.js Edge middleware runs on every request.
  // in multilanguage scenarios, we need locale middleware to always run first to ensure locale is set and used correctly by the rest of the middlewares
  skip: () => false,
});

const multisite = new AppRouterMultisiteProxy({
  /**
   * List of sites for site resolver to work with
   */
  sites,
  ...scConfig.api.edge,
  ...scConfig.multisite,
  // This function determines if the middleware should be turned off on per-request basis.
  // Certain paths are ignored by default (e.g. files and Next.js API routes), but you may wish to disable more.
  // This is an important performance consideration since Next.js Edge middleware runs on every request.
  skip: () => false,
});

const redirects = new RedirectsProxy({
  /**
   * List of sites for site resolver to work with
   */
  sites,
  ...scConfig.api.edge,
  ...scConfig.api.local,
  ...scConfig.redirects,
  // This function determines if the middleware should be turned off on per-request basis.
  // Certain paths are ignored by default (e.g. Next.js API routes), but you may wish to disable more.
  // By default it is disabled while in development mode.
  // This is an important performance consideration since Next.js Edge middleware runs on every request.
  skip: () => false,
});

const personalize = new CannabisSensePersonalizeProxy({
  sites,
  ...scConfig.api.edge,
  ...scConfig.personalize,
  enabled: process.env.CANNABISSENSE_NATIVE_PERSONALIZATION === '1' ||
    process.env.AGLC_NATIVE_PERSONALIZATION === '1',
});

export default async function proxy(req: NextRequest) {
  const host = req.headers.get('host');
  // A visitor must not force an SDK-internal variant path directly.
  if ((host?.toLowerCase() === DEMO_HOST || host?.toLowerCase() === AGLC_HOST) &&
      isExternalVariantPath(req.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  }
  const policy = configuredPolicy(host);
  const response = await defineProxy(preview, locale, multisite, redirects, personalize).exec(req);
  if (policy && req.nextUrl.pathname === policy.path) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    const remaining = consentRemainingSeconds(req.cookies.get(policy.cookie)?.value);
    for (const name of SITECORE_COOKIES) {
      const cookie = response.cookies.get(name);
      if (cookie) response.cookies.set(name, cookie.value, scopedCookie(remaining, policy.path));
    }
  }
  return response;
}

export const config = {
  /*
   * Match all paths except for:
   * 1. API route handlers
   * 2. /_next (Next.js internals)
   * 3. /sitecore/api (Sitecore API routes)
   * 4. /- (Sitecore media)
   * 5. /healthz (Health check)
   * 7. all root files inside /public
   */
  matcher: [
    '/',
    '/((?!api/|\\.well-known/|sitemap|robots|llms|_next/|healthz|sitecore/api/|-/|favicon.ico|sc_logo.svg|ai/).*)',
  ],
};