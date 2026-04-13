'use client'

import type { Agent } from '@/types'
import Toggle from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'

export interface AgentCardProps {
  agent: Agent
  onToggle: (enabled: boolean) => void
}

export default function AgentCard({ agent, onToggle }: AgentCardProps) {
  return (
    <div
      className={cn(
        'px-3 py-3 transition-all duration-150',
        'hover:bg-[--surface] cursor-default',
        !agent.isEnabled && 'opacity-40 grayscale',
      )}
      style={{
        borderLeft: `3px solid ${agent.isEnabled ? agent.accentColor : 'var(--border)'}`,
        transition: 'border-color 150ms ease, opacity 150ms ease',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="font-display text-xs font-semibold text-[--text-primary] truncate">
            {agent.name}
          </span>
          <span
            className="text-[9px] font-mono uppercase tracking-[0.08em]"
            style={{ color: agent.accentColor }}
          >
            {agent.vibeLabel}
          </span>
        </div>
        <Toggle
          pressed={agent.isEnabled}
          onPressedChange={onToggle}
          aria-label={`${agent.isEnabled ? 'Disabilita' : 'Abilita'} ${agent.name}`}
        />
      </div>

      <p className="mt-2 text-[10px] font-body text-[--text-muted] leading-relaxed line-clamp-2">
        {agent.persona}
      </p>

      <div className="mt-2 flex items-center gap-1">
        <a
          href={`https://github.com/${agent.contributorHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[--text-primary] hover:text-[--accent-system] transition-colors"
          tabIndex={agent.isEnabled ? 0 : -1}
          onClick={(e) => e.stopPropagation()}
        >
          {agent.contributorName}
        </a>
        <span className="font-mono text-[9px] text-[--text-muted]">
          @{agent.contributorHandle}
        </span>
      </div>
    </div>
  )
}
