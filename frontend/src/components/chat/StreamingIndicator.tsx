export interface StreamingIndicatorProps {
  agentName?: string
  accentColor?: string
}

export default function StreamingIndicator({ agentName, accentColor }: StreamingIndicatorProps) {
  const color = accentColor ?? '#71717a'
  const displayName = agentName ?? 'Il sistema'

  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex items-center gap-1" aria-hidden="true">
        <span className="blink-dot-1 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="blink-dot-2 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="blink-dot-3 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <p
        className="text-[10px] font-mono tracking-[0.06em] italic"
        style={{ color }}
        aria-live="polite"
        aria-label={`${displayName} sta formulando una risposta`}
      >
        &ldquo;{displayName} sta formulando una risposta inadeguata...&rdquo;
      </p>
    </div>
  )
}
