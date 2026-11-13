import { NextResponse } from 'next/server';

/** Demo foundation: discourage indexing. This is not access control. */
export async function GET() {
  return new NextResponse('User-agent: *\nDisallow: /\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
