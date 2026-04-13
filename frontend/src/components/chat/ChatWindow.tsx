'use client'

import type { ChatSession, Agent } from '@/types'
import { MIN_MESSAGES_FOR_SHAME } from '@/lib/constants'
import MessageList from './MessageList'
import ChatInputBar from './ChatInputBar'
import SubmitToShameButton from './SubmitToShameButton'

export interface ChatWindowProps {
  session: ChatSession
  agents: Agent[]
  onSendMessage: (text: string) => void
  isStreaming: boolean
  conversationId: string
  onShameSuccess: (slug: string) => void
}

export default function ChatWindow({
  session,
  agents,
  onSendMessage,
  isStreaming,
  conversationId,
  onShameSuccess,
}: ChatWindowProps) {
  const showShameButton =
    session.messages.length >= MIN_MESSAGES_FOR_SHAME && !isStreaming

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable message area — grows to fill available height */}
      <div className="flex-1 overflow-hidden min-h-0">
        <MessageList messages={session.messages} agents={agents} />
      </div>

      {/* Optional shame button above input */}
      {showShameButton && (
        <div className="shrink-0">
          <SubmitToShameButton
            sessionMessages={session.messages}
            conversationId={conversationId}
            agents={agents}
            onSuccess={onShameSuccess}
          />
        </div>
      )}

      {/* Input bar — always anchored to the bottom */}
      <div className="shrink-0">
        <ChatInputBar onSend={onSendMessage} disabled={isStreaming} />
      </div>
    </div>
  )
}
