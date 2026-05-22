export default function RunningTicker({ text, theme, compact = false }) {
  if (!text) return null

  return (
    <div
      className={`${theme.ticker} w-full overflow-hidden border-t ${
        compact ? 'py-1.5' : 'py-3'
      }`}
    >
      <div
        className={`ticker-track whitespace-nowrap font-semibold tracking-wide ${
          compact ? 'text-xs' : 'text-2xl md:text-3xl'
        }`}
      >
        <span>{text}</span>
        <span className="mx-8 opacity-60">&middot;</span>
        <span>{text}</span>
        <span className="mx-8 opacity-60">&middot;</span>
        <span>{text}</span>
      </div>
    </div>
  )
}
