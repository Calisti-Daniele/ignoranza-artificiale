'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import StreamingIndicator from '@/components/chat/StreamingIndicator'
import Button from '@/components/ui/Button'

export interface MasterAgentGreetingProps {
  greeting: string
  isLoading: boolean
}

export default function MasterAgentGreeting({ greeting, isLoading }: MasterAgentGreetingProps) {
  const CORPORATE_COLOR = '#dc2626'

  const words = useMemo(() => {
    if (!greeting) return []
    return greeting.split(/(\s+)/).filter(Boolean)
  }, [greeting])

  const isComplete = !isLoading && greeting.length > 0

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      {/* Agent label */}
      <div
        className="inline-flex items-center gap-2 self-start px-2 py-1 border"
        style={{ borderColor: CORPORATE_COLOR, backgroundColor: `${CORPORATE_COLOR}1a` }}
      >
        <span
          className="font-mono text-[9px] uppercase tracking-[0.1em]"
          style={{ color: CORPORATE_COLOR }}
        >
          Corporate Manager — Agente di Coordinamento
        </span>
      </div>

      {/* Greeting text */}
      <div
        className="font-body text-sm text-[--text-primary] leading-relaxed min-h-[4rem]"
        aria-live="polite"
        aria-label="Messaggio di benvenuto"
      >
        {isLoading && !greeting && (
          <StreamingIndicator agentName="Corporate Manager" accentColor={CORPORATE_COLOR} />
        )}

        {words.length > 0 && (
          <p>
            {words.map((word, i) => (
              <span
                key={i}
                className="word-reveal inline"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {word}
              </span>
            ))}
            {isLoading && (
              <span className="inline-flex ml-2 align-middle">
                <StreamingIndicator agentName="Corporate Manager" accentColor={CORPORATE_COLOR} />
              </span>
            )}
          </p>
        )}
      </div>

      {/* CTA button — only shown after greeting */}
      {isComplete && (
        <div
          className="word-reveal"
          style={{ animationDelay: `${Math.min(words.length * 30 + 200, 1500)}ms` }}
        >
          <Link href="/chat">
            <Button variant="primary" size="lg">
              Accedi alla piattaforma
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
