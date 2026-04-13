import Link from 'next/link'
import type { ShameEntry } from '@/types'
import AgentBadge from '@/components/chat/AgentBadge'
import { cn } from '@/lib/utils'
import { formatItalianDate } from '@/lib/utils'
import { ArrowUp } from 'lucide-react'

export interface ShameCardProps {
  entry: ShameEntry
}

export default function ShameCard({ entry }: ShameCardProps) {
  return (
    <Link
      href={`/vergogna/${entry.slug}`}
      className={cn(
        'group block bg-[--surface] border border-[--border]',
        'p-5 transition-colors duration-150 hover:border-[--text-muted]',
        entry.isFeatured && 'md:col-span-2',
      )}
    >
      {entry.isFeatured && (
        <div className="mb-3">
          <span className="inline-block bg-[--accent-system-subtle] border border-[--accent-system] text-[--accent-system] font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-0.5">
            In Evidenza
          </span>
        </div>
      )}

      <h2
        className={cn(
          'font-serif text-[--text-primary] font-normal leading-snug mb-2',
          'group-hover:text-white transition-colors',
          entry.isFeatured ? 'text-xl' : 'text-base',
        )}
      >
        {entry.title}
      </h2>

      <p
        className={cn(
          'font-body text-[--text-muted] text-xs leading-relaxed mb-4',
          entry.isFeatured ? 'line-clamp-4' : 'line-clamp-2',
        )}
      >
        {entry.preview}
      </p>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        {entry.agentSlugs.map((slug) => (
          <AgentBadge
            key={slug}
            agentName={slug}
            accentColor="#71717a"
            size="sm"
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-[--text-muted] tracking-wide">
          {formatItalianDate(entry.createdAt)}
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-[--text-muted]">
          <ArrowUp size={11} />
          {entry.upvoteCount}
        </span>
      </div>
    </Link>
  )
}
