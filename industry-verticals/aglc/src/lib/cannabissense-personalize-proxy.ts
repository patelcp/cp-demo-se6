import { type NextRequest, type NextResponse } from 'next/server';
import { PersonalizeProxy } from '@sitecore-content-sdk/nextjs/proxy';
import {
  campaignContext, configuredPolicy, consentRemainingSeconds,
} from './cannabissense-personalization';

/**
 * Sitecore still chooses and applies the published variant through its native proxy.
 * Reject unrelated traffic, do not send arbitrary campaign data/referrers, and do
 * not initialize browser tracking. The stock server proxy still issues visitor IDs.
 */
export class CannabisSensePersonalizeProxy extends PersonalizeProxy {
  protected disabled(req: NextRequest, res: NextResponse) {
    const policy = configuredPolicy(req.headers.get('host'));
    return !policy || req.method !== 'GET' || req.nextUrl.pathname !== policy.path ||
      (policy.site === 'cannabissense' ? !campaignContext(req.nextUrl.searchParams) : Boolean(req.nextUrl.search)) ||
      !consentRemainingSeconds(req.cookies.get(policy.cookie)?.value) ||
      this.getSite(req, res).name.toLowerCase() !== policy.site ||
      this.getLanguage(req, res).toLowerCase() !== 'en' ||
      super.disabled(req, res);
  }

  protected getExperienceParams(req: NextRequest) {
    const campaign = configuredPolicy(req.headers.get('host'))?.site === 'cannabissense'
      ? campaignContext(req.nextUrl.searchParams) : null;
    return {
      referrer: '',
      utm: { campaign: campaign?.campaign, source: campaign?.source, content: undefined, medium: undefined },
    };
  }
}
