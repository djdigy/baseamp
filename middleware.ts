import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Root path: rewrite to /dashboard internally but keep URL as /
  // This serves /dashboard content at / — NOT a redirect, so status = 200
  if (request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/dashboard', request.url))
  }
}

export const config = {
  matcher: ['/'],
}
