import { cn } from '@/lib/utils'

export interface AgentBadgeProps {
  agentName: string
  accentColor: string
  size?: 'sm' | 'md'
  className?: string
}

export default function AgentBadge({ agentName, accentColor, size = 'md', className }: AgentBadgeProps) {
  return (
    <span
      style={{
        backgroundColor: `${accentColor}33`,
        borderColor: accentColor,
        color: accentColor,
      }}
      className={cn(
        'inline-flex items-center border rounded-sm font-mono uppercase tracking-[0.08em] select-none',
        size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        className,
      )}
    >
      {agentName}
    </span>
  )
}
