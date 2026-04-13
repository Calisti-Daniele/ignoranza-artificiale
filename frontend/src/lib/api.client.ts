import type { ChatMessage, SubmitShameResponse, UpvoteResponse } from '@/types'
import { API_BASE_URL } from './constants'
import { getSessionId } from './utils'

function getHeaders(sessionId?: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Session-ID': sessionId ?? getSessionId(),
  }
}

interface SubmitShameApiResponse {
  id: string
  slug: string
  title: string
  public_url: string
  created_at: string
}

interface UpvoteApiResponse {
  slug: string
  upvote_count: number
}

export async function submitToShame(
  messages: ChatMessage[],
  sessionId: string,
  conversationId: string,
  title: string,
): Promise<SubmitShameResponse> {
  const agentSlugs = [
    ...new Set(
      messages
        .filter((m) => m.role === 'agent' && m.agentSlug)
        .map((m) => m.agentSlug as string),
    ),
  ]

  const transcript = messages.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
    agent_slug: m.agentSlug,
    agent_name: m.agentName,
  }))

  const res = await fetch(`${API_BASE_URL}/api/v1/shame`, {
    method: 'POST',
    headers: getHeaders(sessionId),
    body: JSON.stringify({
      conversation_id: conversationId,
      title,
      transcript,
      agent_slugs: agentSlugs,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: { code: 'UNKNOWN', message: 'Errore sconosciuto' } }))
    throw err
  }

  const data = await res.json() as SubmitShameApiResponse
  return {
    slug: data.slug,
    publicUrl: data.public_url,
  }
}

export async function upvoteShameEntry(slug: string): Promise<UpvoteResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/shame/${encodeURIComponent(slug)}/upvote`, {
    method: 'POST',
    headers: getHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: { code: 'UNKNOWN', message: 'Errore' } }))
    throw err
  }
  const data = await res.json() as UpvoteApiResponse
  return {
    slug: data.slug,
    upvoteCount: data.upvote_count,
  }
}
