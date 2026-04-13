'use client'

import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[--accent-system] text-white hover:bg-red-700 disabled:bg-red-900 disabled:text-red-400',
  ghost:
    'border border-[--border] text-[--text-primary] hover:bg-[--surface] disabled:opacity-40',
  danger:
    'bg-[--accent-system-subtle] border border-[--accent-system] text-[--accent-system] hover:bg-red-900/40 disabled:opacity-40',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  variant = 'ghost',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-display font-medium tracking-wide',
        'transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-system] focus-visible:ring-offset-1 focus-visible:ring-offset-[--background]',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {isLoading && (
        <svg
          className="animate-spin h-3.5 w-3.5 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
