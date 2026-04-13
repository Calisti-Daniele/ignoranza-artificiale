'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
            'w-full max-w-lg bg-[--surface] border border-[--border] p-6',
            'shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            className,
          )}
        >
          {title && (
            <Dialog.Title className="font-display text-base font-medium text-[--text-primary] mb-1">
              {title}
            </Dialog.Title>
          )}
          {description && (
            <Dialog.Description className="text-sm text-[--text-muted] font-body mb-4">
              {description}
            </Dialog.Description>
          )}
          {children}
          <Dialog.Close
            className="absolute right-4 top-4 text-[--text-muted] hover:text-[--text-primary] transition-colors"
            aria-label="Chiudi"
          >
            <X size={16} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
