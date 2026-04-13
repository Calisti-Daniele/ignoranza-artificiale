'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import MasterAgentGreeting from '@/components/gateway/MasterAgentGreeting'
import { API_BASE_URL } from '@/lib/constants'
import { getSessionId } from '@/lib/utils'
import Button from '@/components/ui/Button'

// Corporate manager agent slug — adjust if backend slug differs
const CORPORATE_MANAGER_SLUG = 'corporate-manager'
const GREETING_PROMPT = 'Presentati all\'utente come Corporate Manager.'

export default function LandingClient() {
  const [greeting, setGreeting] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [greetingError, setGreetingError] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const sessionId = getSessionId()

    fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify({
        message: GREETING_PROMPT,
        agent_slug: CORPORATE_MANAGER_SLUG,
        conversation_history: [],
      }),
    })
      .then(async (res) => {
        if (!res.ok || !res.body) {
          setIsLoading(false)
          setGreetingError(true)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const raw = trimmed.slice(5).trim()
            if (!raw || raw === '[DONE]') continue

            try {
              const parsed = JSON.parse(raw) as { event: string; delta?: string; full_message?: string }
              if (parsed.event === 'token' && parsed.delta) {
                setGreeting((prev) => prev + parsed.delta)
              } else if (parsed.event === 'done') {
                if (parsed.full_message) setGreeting(parsed.full_message)
                setIsLoading(false)
              } else if (parsed.event === 'error') {
                setIsLoading(false)
                setGreetingError(true)
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
        setGreetingError(true)
      })
  }, [])

  return (
    <div
      className="relative min-h-screen bg-[--background] overflow-hidden"
      style={{ fontFamily: 'var(--font-dm-sans)' }}
    >
      {/* Subtle grid lines — corporate misconfigured tool aesthetic */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(39,39,42,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(39,39,42,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Top-left logo */}
      <div className="absolute top-6 left-8 z-10">
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-[--text-muted]">
          Ignoranza Artificiale™
        </span>
        <span className="ml-3 font-mono text-[9px] text-[--text-muted] opacity-50">
          v4.2.1-BETA
        </span>
      </div>

      {/* Status indicator top-right */}
      <div className="absolute top-6 right-8 z-10 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="font-mono text-[9px] text-[--text-muted] uppercase tracking-[0.08em]">
          Sistema Operativo
        </span>
      </div>

      {/* Main content — deliberately off-center */}
      <div className="relative z-10 flex flex-col" style={{ paddingLeft: '8vw', paddingTop: '32vh' }}>
        {/* Tagline */}
        <div style={{ marginBottom: '6vh' }}>
          <p
            className="font-serif text-[--text-muted] font-normal"
            style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', maxWidth: '600px', lineHeight: 1.4 }}
          >
            Il sistema è operativo.
            <br />
            <span className="text-[--text-primary]">Siamo spiacenti.</span>
          </p>
        </div>

        {/* Greeting / CTA */}
        <div style={{ maxWidth: '560px' }}>
          {greetingError ? (
            <div className="flex flex-col gap-4">
              <p className="font-mono text-xs text-[--text-muted]">
                Elaborazione in corso. Si prega di attendere.
              </p>
              <Link href="/chat">
                <Button variant="primary" size="lg">
                  Accedi alla piattaforma
                </Button>
              </Link>
            </div>
          ) : (
            <MasterAgentGreeting greeting={greeting} isLoading={isLoading} />
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[--border] px-8 py-2 flex items-center justify-between">
        <span className="font-mono text-[9px] text-[--text-muted] uppercase tracking-[0.06em]">
          Ignoranza Artificiale™ — Tutti i diritti distorti
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/vergogna"
            className="font-mono text-[9px] text-[--text-muted] hover:text-[--text-primary] uppercase tracking-[0.06em] transition-colors"
          >
            Hall of Shame
          </Link>
          <Link
            href="/chat"
            className="font-mono text-[9px] text-[--text-muted] hover:text-[--text-primary] uppercase tracking-[0.06em] transition-colors"
          >
            Chat
          </Link>
        </div>
      </div>
    </div>
  )
}
