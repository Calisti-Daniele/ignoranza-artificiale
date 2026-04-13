import type { Agent } from '@/types'
import AgentCard from './AgentCard'
import Skeleton from '@/components/ui/Skeleton'

export interface AgentRosterProps {
  agents: Agent[]
  onToggleAgent: (agentId: string, enabled: boolean) => void
  isLoading?: boolean
}

export default function AgentRoster({ agents, onToggleAgent, isLoading }: AgentRosterProps) {
  return (
    <div className="flex flex-col">
      <div className="px-3 py-3 border-b border-[--border]">
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[--text-muted]">
          Agenti Disponibili
        </span>
      </div>

      <div className="flex flex-col divide-y divide-[--border]">
        {isLoading && (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-3 py-3 flex flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-16" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-3/4" />
              </div>
            ))}
          </>
        )}
        {!isLoading && agents.length === 0 && (
          <p className="px-3 py-4 text-[10px] font-mono text-[--text-muted]">
            Nessun agente disponibile.
          </p>
        )}
        {!isLoading &&
          agents.map((agent) => (
            <AgentCard
              key={agent.slug}
              agent={agent}
              onToggle={(enabled) => onToggleAgent(agent.slug, enabled)}
            />
          ))}
      </div>
    </div>
  )
}
