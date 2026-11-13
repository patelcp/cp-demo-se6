import { NextResponse } from 'next/server';

/** Process readiness only; not a claim that Sitecore content or editing is connected. */
export async function GET() {
  return NextResponse.json({ status: 'ok', application: 'aglc-cannabissense' });
}
