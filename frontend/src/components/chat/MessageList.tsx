'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage, Agent } from '@/types'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: ChatMessage[]
  agents: Agent[]
}

export default function MessageList({ messages, agents }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  const agentMap = agents.reduce<Record<string, Agent>>((acc, agent) => {
    acc[agent.slug] = agent
    return acc
  }, {})

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[--text-muted] font-mono text-xs tracking-wide">
          Nessun messaggio. Inizia la conversazione.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
      {messages.map((msg) => {
        const agent = msg.agentSlug ? agentMap[msg.agentSlug] : undefined
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            agentAccentColor={agent?.accentColor}
          />
        )
      })}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
