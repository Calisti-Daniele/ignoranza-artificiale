/**
 * Runtime proxy for all /api/v1/* requests.
 *
 * Next.js rewrites are resolved at build time (standalone output), so they
 * cannot pick up runtime env vars like API_INTERNAL_URL when running inside
 * Docker. This route handler runs at request time, reads the env var fresh on
 * every call, and correctly forwards to http://backend:8000 in Docker or
 * http://localhost:8000 in local dev — without any rebuild required.
 *
 * Streaming responses (SSE for LLM output) are forwarded transparently by
 * piping the response body directly.
 */

import { type NextRequest } from 'next/server'

const BACKEND = process.env.API_INTERNAL_URL ?? 'http://localhost:8000'

// Headers that must not be forwarded upstream (hop-by-hop or Next.js internals)
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
])

function forwardHeaders(source: Headers): Headers {
  const out = new Headers()
  source.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      out.set(key, value)
    }
  })
  return out
}

async function proxy(req: NextRequest, path: string[]): Promise<Response> {
  const segment = path.join('/')
  const target = new URL(`${BACKEND}/api/v1/${segment}`)
  // Forward query string
  req.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v))

  const upstreamRes = await fetch(target, {
    method: req.method,
    headers: forwardHeaders(req.headers),
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    // Required for streaming request bodies (e.g. POST with ReadableStream)
    // @ts-expect-error — Node 18+ fetch supports this flag
    duplex: 'half',
  })

  // Stream the response body back; works for both JSON and SSE
  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: forwardHeaders(upstreamRes.headers),
  })
}

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params
  return proxy(req, path)
}

// Disable body parsing — we stream the raw body to the backend
export const dynamic = 'force-dynamic'
