import { type NextRequest, type NextResponse } from 'next/server';
import { PersonalizeProxy } from '@sitecore-content-sdk/nextjs/proxy';
import {
  campaignContext, consentRemainingSeconds, CONSENT_COOKIE, DEMO_PATH, enabledOnHost,
} from './cannabissense-personalization';

/**
 * Sitecore still chooses and applies the published variant through its native proxy.
 * Reject unrelated traffic, do not send arbitrary campaign data/referrers, and do
 * not initialize browser tracking. The stock server proxy still issues visitor IDs.
 */
export class CannabisSensePersonalizeProxy extends PersonalizeProxy {
  protected disabled(req: NextRequest, res: NextResponse) {
    return !enabledOnHost(req.headers.get('host')) ||
      req.method !== 'GET' || req.nextUrl.pathname !== DEMO_PATH ||
      !campaignContext(req.nextUrl.searchParams) ||
      !consentRemainingSeconds(req.cookies.get(CONSENT_COOKIE)?.value) ||
      this.getSite(req, res).name.toLowerCase() !== 'cannabissense' ||
      this.getLanguage(req, res).toLowerCase() !== 'en' ||
      super.disabled(req, res);
  }

  protected getExperienceParams(req: NextRequest) {
    const campaign = campaignContext(req.nextUrl.searchParams);
    return {
      referrer: '',
      utm: { campaign: campaign?.campaign, source: campaign?.source, content: undefined, medium: undefined },
    };
  }
}
