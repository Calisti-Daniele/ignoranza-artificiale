import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchShameTranscript, fetchAgents } from '@/lib/api.server'
import ShameTranscript from '@/components/shame/ShameTranscript'
import UpvoteButton from '@/components/shame/UpvoteButton'
import AgentBadge from '@/components/chat/AgentBadge'
import Navbar from '@/components/layout/Navbar'
import type { Agent } from '@/types'
import { formatItalianDate } from '@/lib/utils'
import ShareButton from './_components/ShareButton'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const entry = await fetchShameTranscript(slug)
    return {
      title: `${entry.title} — Hall of Shame`,
      description: `Sessione archiviata il ${formatItalianDate(entry.createdAt)}. ${entry.upvoteCount} voti.`,
      openGraph: {
        title: entry.title,
        description: 'Archivio Pubblico delle Disfunzioni Artificiali — Ignoranza Artificiale™',
        type: 'article',
      },
    }
  } catch {
    return {
      title: 'Sessione non trovata — Ignoranza Artificiale™',
    }
  }
}

export default async function VergognaSlugPage({ params }: Props) {
  const { slug } = await params

  let entry
  try {
    entry = await fetchShameTranscript(slug)
  } catch (err: unknown) {
    const error = err as Error
    if (error.message === 'NOT_FOUND') notFound()
    // On other errors, show fallback
    notFound()
  }

  // Fetch agents for color mapping — best effort
  let agents: Agent[] = []
  try {
    agents = await fetchAgents()
  } catch {
    agents = []
  }

  const agentMap = agents.reduce<Record<string, Agent>>((acc, a) => {
    acc[a.slug] = a
    return acc
  }, {})

  // Extract agent slugs from messages
  const agentSlugsInTranscript = [
    ...new Set(
      entry.messages
        .filter((m) => m.agentSlug)
        .map((m) => m.agentSlug as string),
    ),
  ]

  return (
    <div className="min-h-screen bg-[--background]">
      <Navbar />

      <div className="pt-12 max-w-3xl mx-auto px-6 pb-24">
        {/* Header */}
        <div className="py-10 border-b border-[--border] mb-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--text-muted] mb-3">
            Hall of Shame — Sessione Archiviata
          </p>
          <h1 className="font-serif text-2xl font-normal text-[--text-primary] leading-snug mb-4">
            {entry.title}
          </h1>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-mono text-[10px] text-[--text-muted]">
              {formatItalianDate(entry.createdAt)}
            </span>
            <span className="font-mono text-[10px] text-[--text-muted]">
              {entry.upvoteCount} voti
            </span>
            {entry.isFeatured && (
              <span className="inline-block bg-[--accent-system-subtle] border border-[--accent-system] text-[--accent-system] font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-0.5">
                In Evidenza
              </span>
            )}
          </div>

          {/* Agent badges */}
          {agentSlugsInTranscript.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {agentSlugsInTranscript.map((slug) => {
                const agent = agentMap[slug]
                return (
                  <AgentBadge
                    key={slug}
                    agentName={agent?.name ?? slug}
                    accentColor={agent?.accentColor ?? '#71717a'}
                    size="sm"
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Transcript */}
        <ShameTranscript messages={entry.messages} agentMap={agentMap} />
      </div>

      {/* Fixed bottom-right actions */}
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-3 z-30">
        <ShareButton slug={slug} />
        <UpvoteButton slug={entry.slug} initialCount={entry.upvoteCount} />
      </div>
    </div>
  )
}
