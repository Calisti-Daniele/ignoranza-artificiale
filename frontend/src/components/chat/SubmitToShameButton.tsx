'use client'

import { useState, useCallback } from 'react'
import type { ChatMessage, Agent } from '@/types'
import { MIN_MESSAGES_FOR_SHAME } from '@/lib/constants'
import { submitToShame } from '@/lib/api.client'
import { getSessionId } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Trophy, Copy, Check } from 'lucide-react'

export interface SubmitToShameButtonProps {
  sessionMessages: ChatMessage[]
  conversationId: string
  agents: Agent[]
  onSuccess: (slug: string) => void
}

export default function SubmitToShameButton({
  sessionMessages,
  conversationId,
  agents: _agents,
  onSuccess,
}: SubmitToShameButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shameSlug, setShameSlug] = useState<string | null>(null)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const visible = sessionMessages.length >= MIN_MESSAGES_FOR_SHAME

  const buildTitle = () => {
    const firstUserMsg = sessionMessages.find((m) => m.role === 'user')
    if (!firstUserMsg) return 'Sessione senza titolo'
    const truncated = firstUserMsg.content.slice(0, 60)
    return truncated.length < firstUserMsg.content.length ? `${truncated}...` : truncated
  }

  const handleSubmit = useCallback(async () => {
    if (isLoading || shameSlug) return
    setIsLoading(true)
    setError(null)

    try {
      const sessionId = getSessionId()
      const title = buildTitle()
      const result = await submitToShame(sessionMessages, sessionId, conversationId, title)
      setShameSlug(result.slug)
      setPublicUrl(result.publicUrl)
      onSuccess(result.slug)
    } catch (err: unknown) {
      const errObj = err as { detail?: { message?: string } }
      setError(errObj?.detail?.message ?? 'Si è verificato un errore imprevisto. Il sistema è costernato.')
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, shameSlug, sessionMessages, conversationId, onSuccess])

  const handleCopy = useCallback(() => {
    if (!publicUrl) return
    const fullUrl = `${window.location.origin}/vergogna/${shameSlug}`
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [publicUrl, shameSlug])

  if (!visible) return null

  if (shameSlug) {
    return (
      <div className="mx-4 my-3 bg-[--surface] border border-[--border] px-4 py-3 font-mono text-xs">
        <p className="text-[--accent-system] uppercase tracking-[0.08em] mb-2">
          Archiviazione completata
        </p>
        <p className="text-[--text-muted] mb-3">
          La sessione è stata archiviata con successo. La vergogna è ora di dominio pubblico.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[--text-primary] truncate flex-1">
            /vergogna/{shameSlug}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            aria-label="Copia URL"
            className="shrink-0 gap-1"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copiato' : 'Copia URL'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-4 my-3 flex flex-col gap-2">
      <Button
        variant="danger"
        size="sm"
        onClick={handleSubmit}
        isLoading={isLoading}
        className="self-start gap-1.5"
        aria-label="Invia questa conversazione alla Hall of Shame"
      >
        <Trophy size={13} />
        {isLoading ? 'Trasmissione in corso...' : 'Invia alla Hall of Shame'}
      </Button>
      {error && (
        <p className="text-[10px] font-mono text-[--accent-system]">{error}</p>
      )}
    </div>
  )
}
