import type { ShameEntry } from '@/types'
import ShameCard from './ShameCard'

export interface ShameGalleryProps {
  entries: ShameEntry[]
}

export default function ShameGallery({ entries }: ShameGalleryProps) {
  if (entries.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono text-xs text-[--text-muted] tracking-[0.1em] uppercase">
          Nessuna disfunzione catalogata. Per ora.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[--border]">
      {entries.map((entry) => (
        <ShameCard key={entry.id} entry={entry} />
      ))}
    </div>
  )
}
