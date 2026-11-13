import { defineConfig } from '@sitecore-content-sdk/nextjs/config';

/** One head, two native sites. Actual Edge IDs and editing secrets stay in host settings. */
export default defineConfig({
  defaultSite: process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME || 'aglc',
  defaultLanguage: process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || 'en',
  multisite: {
    enabled: true,
    useCookieResolution: () => false,
  },
});
