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
    <div className="flex flex-col h-full overflow-hidden">
      <MessageList messages={session.messages} agents={agents} />

      {showShameButton && (
        <SubmitToShameButton
          sessionMessages={session.messages}
          conversationId={conversationId}
          agents={agents}
          onSuccess={onShameSuccess}
        />
      )}

      <ChatInputBar onSend={onSendMessage} disabled={isStreaming} />
    </div>
  )
}
