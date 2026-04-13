'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
  slug: string
}

export default function ShareButton({ slug }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const url = `${window.location.origin}/vergogna/${slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copia URL della sessione"
      className={cn(
        'flex flex-col items-center gap-1 px-4 py-3',
        'border border-[--border] bg-[--surface]',
        'font-mono text-xs text-[--text-muted]',
        'hover:text-[--text-primary] hover:border-[--text-muted]',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-system]',
        copied && 'text-green-500 border-green-700',
      )}
    >
      {copied ? <Check size={18} /> : <Link2 size={18} />}
      <span className="text-[10px]">{copied ? 'Copiato' : 'Condividi'}</span>
    </button>
  )
}
