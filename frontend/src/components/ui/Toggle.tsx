'use client'

import * as RadixToggle from '@radix-ui/react-toggle'
import { cn } from '@/lib/utils'

interface ToggleProps {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  'aria-label'?: string
  disabled?: boolean
  className?: string
}

export default function Toggle({
  pressed,
  onPressedChange,
  'aria-label': ariaLabel,
  disabled,
  className,
}: ToggleProps) {
  return (
    <RadixToggle.Root
      pressed={pressed}
      onPressedChange={onPressedChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full',
        'border-2 border-transparent transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-system] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        pressed ? 'bg-[--accent-system]' : 'bg-[--border]',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm',
          'transform transition-transform duration-200',
          pressed ? 'translate-x-4' : 'translate-x-0',
        )}
        aria-hidden="true"
      />
    </RadixToggle.Root>
  )
}
