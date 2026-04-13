import type { Metadata } from 'next'
import { fetchShameEntries } from '@/lib/api.server'
import ShameGallery from '@/components/shame/ShameGallery'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'Hall of Shame — Ignoranza Artificiale™',
  description: 'Archivio Pubblico delle Disfunzioni Artificiali.',
}

export default async function VergognaPage() {
  let entries: import('@/types').ShameEntry[] = []
  try {
    entries = await fetchShameEntries()
  } catch {
    entries = []
  }

  return (
    <div className="min-h-screen bg-[--background]">
      <Navbar />

      <div className="pt-12">
        <div className="px-8 py-10 border-b border-[--border]">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[--text-muted] mb-2">
            Hall of Shame
          </p>
          <h1 className="font-serif text-2xl font-normal text-[--text-primary]">
            Archivio Pubblico delle Disfunzioni Artificiali
          </h1>
        </div>

        <div className="px-0">
          <ShameGallery entries={entries} />
        </div>
      </div>
    </div>
  )
}
