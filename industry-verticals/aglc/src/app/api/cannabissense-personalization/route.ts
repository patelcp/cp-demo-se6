import { NextResponse, type NextRequest } from 'next/server';
import {
  campaignContext, configuredPolicy, CONSENT_SECONDS, scopedCookie, SITECORE_COOKIES,
} from '../../../lib/cannabissense-personalization';

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

export async function POST(request: NextRequest) {
  const policy = configuredPolicy(request.headers.get('host'));
  if (!policy) return new NextResponse(null, { status: 404, headers });
  const origin = `https://${policy.host}`;
  if (request.headers.get('origin') !== origin ||
      !request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) {
    return new NextResponse(null, { status: 403, headers });
  }

  let params: URLSearchParams;
  try {
    const source = await request.text();
    if (source.length > 512) return new NextResponse(null, { status: 413, headers });
    params = new URLSearchParams(source);
  } catch {
    return new NextResponse(null, { status: 400, headers });
  }
  const choice = params.getAll('choice');
  if (choice.length !== 1 || (choice[0] !== 'allow' && choice[0] !== 'revoke')) {
    return new NextResponse(null, { status: 400, headers });
  }
  params.delete('choice');
  const destination = new URL(policy.path, origin);
  const allow = choice[0] === 'allow';
  const campaign = allow && policy.site === 'cannabissense' && campaignContext(params);
  if (campaign) {
    destination.searchParams.set('utm_campaign', campaign.campaign);
    if (campaign.source) destination.searchParams.set('utm_source', campaign.source);
  }
  const response = NextResponse.redirect(destination, { status: 303, headers });
  if (allow) {
    const expiry = Math.floor(Date.now() / 1000) + CONSENT_SECONDS;
    response.cookies.set(policy.cookie, String(expiry), scopedCookie(CONSENT_SECONDS, policy.path));
  } else {
    for (const cookie of [policy.cookie, ...SITECORE_COOKIES]) {
      response.cookies.set(cookie, '', scopedCookie(0, policy.path));
    }
  }
  return response;
}
