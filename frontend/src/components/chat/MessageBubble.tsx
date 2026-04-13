'use client'

import { useState, useEffect } from 'react'
import type { ChatMessage } from '@/types'
import AgentBadge from './AgentBadge'
import StreamingIndicator from './StreamingIndicator'
import { cn } from '@/lib/utils'

export interface MessageBubbleProps {
  message: ChatMessage
  agentAccentColor?: string
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
}

export default function MessageBubble({ message, agentAccentColor }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isAgent = message.role === 'agent'
  const color = agentAccentColor ?? '#71717a'

  // Start with a safely escaped version (works on server + avoids hydration mismatch).
  // After mount, replace with DOMPurify-sanitized output.
  const [sanitizedContent, setSanitizedContent] = useState(() => escapeHtml(message.content))

  useEffect(() => {
    import('dompurify').then(({ default: DOMPurify }) => {
      setSanitizedContent(
        DOMPurify.sanitize(message.content, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li', 'code', 'pre'],
          ALLOWED_ATTR: [],
        }),
      )
    })
  }, [message.content])

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[90%] sm:max-w-[75%] flex flex-col gap-1.5',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        {isAgent && message.agentName && agentAccentColor && (
          <AgentBadge agentName={message.agentName} accentColor={color} size="sm" />
        )}

        <div
          className={cn(
            'px-4 py-3 text-sm font-body leading-relaxed text-[--text-primary]',
            'bg-[--surface]',
            isUser
              ? 'rounded-lg rounded-tr-sm'
              : 'rounded-lg rounded-tl-sm',
          )}
          style={
            isAgent
              ? { borderLeft: `3px solid ${color}` }
              : undefined
          }
          aria-live={message.isStreaming ? 'polite' : undefined}
        >
          {message.isStreaming && !message.content ? (
            <StreamingIndicator agentName={message.agentName} accentColor={color} />
          ) : message.isStreaming ? (
            <>
              {/* eslint-disable-next-line react/no-danger */}
              <div
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                className="whitespace-pre-wrap break-words"
              />
              <StreamingIndicator agentName={message.agentName} accentColor={color} />
            </>
          ) : (
            /* eslint-disable-next-line react/no-danger */
            <div
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              className="whitespace-pre-wrap break-words"
            />
          )}
        </div>

        <span className="text-[10px] font-mono text-[--text-muted] px-1">
          {new Date(message.timestamp).toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}
