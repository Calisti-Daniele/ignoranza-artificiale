import type { ChatMessage, Agent } from '@/types'
import MessageBubble from '@/components/chat/MessageBubble'

export interface ShameTranscriptProps {
  messages: ChatMessage[]
  agentMap: Record<string, Agent>
}

export default function ShameTranscript({ messages, agentMap }: ShameTranscriptProps) {
  if (messages.length === 0) {
    return (
      <p className="font-mono text-xs text-[--text-muted] py-8 text-center">
        Nessun messaggio archiviato.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {messages.map((msg) => {
        const agent = msg.agentSlug ? agentMap[msg.agentSlug] : undefined
        return (
          <MessageBubble
            key={msg.id}
            message={{ ...msg, isStreaming: false }}
            agentAccentColor={agent?.accentColor}
          />
        )
      })}
    </div>
  )
}
