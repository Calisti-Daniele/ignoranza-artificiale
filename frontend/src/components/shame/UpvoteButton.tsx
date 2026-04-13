'use client'

import { useState, useCallback } from 'react'
import { ArrowUp } from 'lucide-react'
import { upvoteShameEntry } from '@/lib/api.client'
import { LOCALSTORAGE_VOTED_PREFIX } from '@/lib/constants'
import { cn } from '@/lib/utils'

export interface UpvoteButtonProps {
  slug: string
  initialCount: number
}

function hasVoted(slug: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(`${LOCALSTORAGE_VOTED_PREFIX}${slug}`) === '1'
}

function markVoted(slug: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${LOCALSTORAGE_VOTED_PREFIX}${slug}`, '1')
}

export default function UpvoteButton({ slug, initialCount }: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [voted, setVoted] = useState(() => hasVoted(slug))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpvote = useCallback(async () => {
    if (voted || isLoading) return
    setIsLoading(true)
    setError(null)

    // Optimistic update
    setCount((prev) => prev + 1)
    setVoted(true)
    markVoted(slug)

    try {
      const result = await upvoteShameEntry(slug)
      setCount(result.upvoteCount)
    } catch {
      // Revert optimistic update
      setCount((prev) => prev - 1)
      setVoted(false)
      localStorage.removeItem(`${LOCALSTORAGE_VOTED_PREFIX}${slug}`)
      setError('Votazione fallita. Riprovare.')
    } finally {
      setIsLoading(false)
    }
  }, [slug, voted, isLoading])

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleUpvote}
        disabled={voted || isLoading}
        aria-label="Vota questa vergogna"
        aria-pressed={voted}
        className={cn(
          'flex flex-col items-center gap-1 px-4 py-3',
          'border border-[--border] bg-[--surface]',
          'font-mono text-xs transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-system]',
          voted
            ? 'text-[--accent-system] border-[--accent-system] cursor-default'
            : 'text-[--text-muted] hover:text-[--text-primary] hover:border-[--text-muted] cursor-pointer',
          isLoading && 'opacity-50 cursor-wait',
        )}
      >
        <ArrowUp
          size={18}
          className={cn(
            'transition-transform',
            voted && 'text-[--accent-system]',
          )}
        />
        <span className="text-sm font-semibold">{count}</span>
      </button>
      {error && (
        <p className="text-[9px] font-mono text-[--accent-system] max-w-[80px] text-center">
          {error}
        </p>
      )}
    </div>
  )
}
