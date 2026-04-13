import { NextRequest, NextResponse } from 'next/server'

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const isDev = process.env.NODE_ENV === 'development'

export function middleware(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const scriptSrc = isDev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}'`

  const csp = [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' fonts.gstatic.com`,
    `connect-src 'self' ${apiUrl}`,
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
