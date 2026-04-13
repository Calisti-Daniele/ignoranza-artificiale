import { NextRequest, NextResponse } from 'next/server'

// NEXT_PUBLIC_API_URL is only needed when the browser must reach the backend
// directly (e.g. a public API domain). In production the frontend proxy
// (src/app/api/v1/[...path]/route.ts) handles all backend traffic server-side,
// so 'self' is sufficient. Set this var only when you expose the backend
// publicly and the browser needs to connect to it directly.
const extraConnectSrc = process.env.NEXT_PUBLIC_API_URL ?? ''
const isDev = process.env.NODE_ENV === 'development'

export function middleware(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const scriptSrc = isDev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}'`

  const connectSrc = ['self', ...(extraConnectSrc ? [extraConnectSrc] : [])]
    .map((v) => (v === 'self' ? `'self'` : v))
    .join(' ')

  const csp = [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' fonts.gstatic.com`,
    `connect-src ${connectSrc}`,
    `frame-ancestors 'none'`,
  ].join('; ')

  const response = NextResponse.next()

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('x-nonce', nonce)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico  (favicon)
     * - public folder assets (images, icons, etc.)
     */
    {
      source: '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
