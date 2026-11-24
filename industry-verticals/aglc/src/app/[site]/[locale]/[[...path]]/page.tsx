import { isDesignLibraryPreviewData } from "@sitecore-content-sdk/nextjs/editing";
import { notFound } from "next/navigation";
import { cookies, draftMode, headers as nextHeaders } from "next/headers";
import { SiteInfo } from "@sitecore-content-sdk/nextjs";
import sites from ".sitecore/sites.json";
import { routing } from "src/i18n/routing";
import scConfig from "sitecore.config";
import client from "src/lib/sitecore-client";
import Layout, { RouteFields } from "src/Layout";
import components from ".sitecore/component-map";
import Providers from "src/Providers";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getBaseUrl } from "lib/utils";
import { CannabisSensePersonalizationConsent } from "components/content-sdk/CannabisSensePersonalizationConsent";
import {
  campaignContext, configuredPolicy, consentRemainingSeconds, parsedSearch,
} from "lib/cannabissense-personalization";

// Refresh published Edge content on the next request after this interval.
export const revalidate = 60;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{
    site: string;
    locale: string;
    path?: string[];
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { site, locale, path } = await params;
  const draft = await draftMode();

  // Set site and locale to be available in src/i18n/request.ts for fetching the dictionary
  setRequestLocale(`${site}_${locale}`);

  // Fetch the page data from Sitecore
  let page;
  if (draft.isEnabled) {
    const headers = await nextHeaders();
    const previewData = client.getPreviewData(headers);
    if (isDesignLibraryPreviewData(previewData)) {
      page = await client.getDesignLibraryData(previewData);
    } else {
      page = await client.getPreview(previewData);
    }
  } else {
    page = await client.getPage(path ?? [], { site, locale });
  }

  // If the page is not found, return a 404
  if (!page) {
    notFound();
  }

  // Fetch the component data from Sitecore (Likely will be deprecated)
  const componentProps = await client.getComponentData(
    page.layout,
    {},
    components,
  );

  let campaignConsent;
  const campaignRoute = site === "cannabissense" && path?.[0] === "basics" &&
    path.slice(1).every(part => part.startsWith("_variantId_"));
  const aglcHome = site === "aglc" &&
    (path ?? []).every(part => part.startsWith("_variantId_"));
  if (!draft.isEnabled && locale === "en" && (campaignRoute || aglcHome)) {
    const policy = configuredPolicy((await nextHeaders()).get("host"));
    if (policy?.site === site) {
      campaignConsent = (
        <CannabisSensePersonalizationConsent
          site={policy.site}
          allowed={Boolean(consentRemainingSeconds((await cookies()).get(policy.cookie)?.value))}
          campaign={campaignRoute ? campaignContext(parsedSearch(await searchParams)) : null}
        />
      );
    }
  }

  return (
    <NextIntlClientProvider>
      <Providers page={page} componentProps={componentProps}>
        <Layout page={page} campaignConsent={campaignConsent} />
      </Providers>
    </NextIntlClientProvider>
  );
}

// This function gets called at build and export time to determine
// pages for SSG ("paths", as tokenized array).
export const generateStaticParams = async () => {
  if (process.env.NODE_ENV !== "development" && scConfig.generateStaticPaths) {
    // Filter sites to only include the sites this starter is designed to serve.
    // This prevents cross-site build errors when multiple starters share the same XM Cloud instance.
    const defaultSite = scConfig.defaultSite;
    const allowedSites = defaultSite
      ? sites
          .filter((site: SiteInfo) => site.name === defaultSite)
          .map((site: SiteInfo) => site.name)
      : sites.map((site: SiteInfo) => site.name);
    return await client.getAppRouterStaticParams(
      allowedSites,
      routing.locales.slice(),
    );
  }
  return [];
};

// Metadata fields for the page.
export const generateMetadata = async ({ params }: PageProps) => {
  const baseUrl = getBaseUrl();

  const { path, site, locale } = await params;

  // Canonical URL: base URL + content path only (no site/locale segments)
  const pathSegment = path?.length ? `/${path.join("/")}` : "";
  const canonicalUrl = baseUrl ? `${baseUrl}${pathSegment}` : undefined;

  // The same call as for rendering the page. Should be cached by default react behavior
  const page = await client.getPage(path ?? [], { site, locale });
  const fields = page?.layout.sitecore.route?.fields as RouteFields;

  // Parse keywords from comma-separated string to array
  const keywordsString = fields?.metadataKeywords?.value?.toString() || "";
  const keywords = keywordsString
    ? keywordsString.split(",").map((k: string) => k.trim())
    : [];

  return {
    title: fields?.Title?.value?.toString() || "Page",
    description:
      fields?.ogDescription?.value?.toString() ||
      fields?.metadataDescription?.value?.toString() ||
      "Sitecore Next.js Basic Example",
    keywords,
    ...(canonicalUrl && {
      alternates: {
        canonical: canonicalUrl,
      },
    }),
    openGraph: {
      title: fields?.ogTitle?.value?.toString() || "Page",
      description:
        fields?.ogDescription?.value?.toString() ||
        fields?.metadataDescription?.value?.toString() ||
        "Sitecore Next.js Basic Example",
      url: canonicalUrl,
      images: fields?.ogImage?.value?.src || fields?.thumbnailImage?.value?.src,
    },
  };
};
