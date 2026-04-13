import { cn } from '@/lib/utils'

interface BadgeProps {
  children?: React.ReactNode
  color?: string
  className?: string
}

export default function Badge({ children, color, className }: BadgeProps) {
  const style = color
    ? {
        backgroundColor: `${color}33`,
        borderColor: color,
        color: color,
      }
    : undefined

  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.08em] border rounded-sm',
        !color && 'bg-[--surface] border-[--border] text-[--text-muted]',
        className,
      )}
    >
      {children}
    </span>
  )
}
