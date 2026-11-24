import { NextResponse, type NextRequest } from 'next/server';
import {
  campaignContext, CONSENT_COOKIE, CONSENT_SECONDS, DEMO_ORIGIN, DEMO_PATH,
  enabledOnHost, scopedCookie, SITECORE_COOKIES,
} from '../../../lib/cannabissense-personalization';

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

export async function POST(request: NextRequest) {
  if (!enabledOnHost(request.headers.get('host'))) return new NextResponse(null, { status: 404, headers });
  if (request.headers.get('origin') !== DEMO_ORIGIN ||
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
  const destination = new URL(DEMO_PATH, DEMO_ORIGIN);
  const allow = choice[0] === 'allow';
  const campaign = allow && campaignContext(params);
  if (campaign) {
    destination.searchParams.set('utm_campaign', campaign.campaign);
    if (campaign.source) destination.searchParams.set('utm_source', campaign.source);
  }
  const response = NextResponse.redirect(destination, { status: 303, headers });
  if (allow) {
    const expiry = Math.floor(Date.now() / 1000) + CONSENT_SECONDS;
    response.cookies.set(CONSENT_COOKIE, String(expiry), scopedCookie(CONSENT_SECONDS));
  } else {
    for (const cookie of [CONSENT_COOKIE, ...SITECORE_COOKIES]) {
      response.cookies.set(cookie, '', scopedCookie(0));
    }
  }
  return response;
}
