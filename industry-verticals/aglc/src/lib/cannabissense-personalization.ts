/** Two isolated native SitecoreAI demo scopes. Context is not the visitor's consent or identity. */
export const DEMO_HOST = 'cannabissense-cp.vercel.app';
export const DEMO_ORIGIN = `https://${DEMO_HOST}`;
export const DEMO_PATH = '/basics';
export const DEMO_CAMPAIGN = 'edibles_education';
export const CONSENT_ENDPOINT = '/api/cannabissense-personalization';
export const CONSENT_COOKIE = '__Secure-cs_edibles_personalization';
export const CONSENT_SECONDS = 30 * 60;
export const SITECORE_COOKIES = ['sc_cid', 'sc_cid_personalize'] as const;

export const AGLC_HOST = 'aglc-cp.vercel.app';
export const AGLC_CONSENT_COOKIE = '__Secure-aglc_native_personalization';

const cannabisSensePolicy = {
  site: 'cannabissense', host: DEMO_HOST, path: DEMO_PATH, cookie: CONSENT_COOKIE,
} as const;
const aglcPolicy = {
  site: 'aglc', host: AGLC_HOST, path: '/', cookie: AGLC_CONSENT_COOKIE,
} as const;
export type PersonalizationPolicy = typeof cannabisSensePolicy | typeof aglcPolicy;

export function configuredPolicy(host: string | null): PersonalizationPolicy | null {
  if (enabledOnHost(host)) return cannabisSensePolicy;
  if (process.env.AGLC_NATIVE_PERSONALIZATION === '1' && host?.toLowerCase() === AGLC_HOST) return aglcPolicy;
  return null;
}

export const enabledOnHost = (host: string | null) =>
  process.env.CANNABISSENSE_NATIVE_PERSONALIZATION === '1' && host?.toLowerCase() === DEMO_HOST;

export function campaignContext(params: URLSearchParams) {
  const campaigns = params.getAll('utm_campaign');
  const sources = params.getAll('utm_source');
  if (campaigns.length !== 1 || campaigns[0] !== DEMO_CAMPAIGN ||
      sources.length > 1 || (sources.length === 1 && sources[0] !== 'instagram')) return null;
  // UTM may carry arbitrary data. Only accept the named demo's permitted values.
  for (const name of params.keys()) {
    if (name !== 'utm_campaign' && name !== 'utm_source') return null;
  }
  return { campaign: DEMO_CAMPAIGN, source: sources[0] };
}

export function consentRemainingSeconds(value: string | undefined, now = Date.now()): number {
  if (!value || !/^\d{10}$/.test(value)) return 0;
  const seconds = Number(value) - Math.floor(now / 1000);
  return seconds > 0 && seconds <= CONSENT_SECONDS ? seconds : 0;
}

export function scopedCookie(maxAge: number, path: string = DEMO_PATH) {
  return {
    path, httpOnly: true, secure: true, sameSite: 'lax' as const, maxAge,
    expires: new Date(maxAge > 0 ? Date.now() + maxAge * 1000 : 0),
  };
}

export function isExternalVariantPath(pathname: string) {
  try { return decodeURIComponent(pathname).split('/').some(part => part.includes('_variantId_')); }
  catch { return true; }
}

export function parsedSearch(values: Record<string, string | string[] | undefined>) {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    for (const entry of typeof value === 'string' ? [value] : (value ?? [])) out.append(key, entry);
  }
  return out;
}
