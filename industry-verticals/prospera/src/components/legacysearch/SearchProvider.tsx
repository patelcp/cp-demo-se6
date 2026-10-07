'use client';

import React, { useEffect } from 'react';
import { PageController, WidgetsProvider } from '@sitecore-search/react';

const searchEnv = process.env.NEXT_PUBLIC_SEARCH_ENV;
const customerKey = process.env.NEXT_PUBLIC_SEARCH_CUSTOMER_KEY?.trim();
const apiKey = process.env.NEXT_PUBLIC_SEARCH_API_KEY?.trim();

// SDK 3 treats a missing customer key as OrderCloud and throws
// "{discoverDomainId} has not been provided", which 500s every page.
const isSearchConfigured = Boolean(customerKey && apiKey);

function setSearchLocale(locale: string) {
  const context = PageController.getContext();

  const normalized = locale.toLowerCase();
  const [language, countryFromLocale] = normalized.split('-');

  const countryByLanguage: Record<string, string> = {
    en: 'us',
    fr: 'ca',
    ja: 'jp',
  };

  const country = countryFromLocale || countryByLanguage[language];

  context.setLocaleLanguage(language);
  context.setLocaleCountry(country);
}

type SearchProviderProps = {
  children: React.ReactNode;
  locale: string;
};

export function SearchProvider({
  children,
  locale,
}: SearchProviderProps) {
  useEffect(() => {
    if (!isSearchConfigured) {
      return;
    }

    setSearchLocale(locale);
  }, [locale]);

  if (!isSearchConfigured || !customerKey || !apiKey) {
    return children;
  }

  return (
    <WidgetsProvider
      env={searchEnv as 'prod'}
      customerKey={customerKey}
      apiKey={apiKey}
      publicSuffix
    >
      {children}
    </WidgetsProvider>
  );
}