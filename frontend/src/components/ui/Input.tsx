import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export default function Input({ error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <input
        {...props}
        className={cn(
          'w-full bg-[--surface] border border-[--border] text-[--text-primary] font-mono text-sm',
          'px-3 py-2 rounded-sm',
          'placeholder:text-[--text-muted]',
          'focus:outline-none focus:border-[--accent-system]',
          'transition-colors duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-[--accent-system]',
          className,
        )}
      />
      {error && (
        <p className="text-xs text-[--accent-system] font-mono">{error}</p>
      )}
    </div>
  )
}
