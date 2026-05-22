import TimerDisplay from '@/components/display/TimerDisplay'

export default function MiniDisplay({ state, tick, mode = 'preview' }) {
  const label = mode === 'program' ? 'PROGRAM' : 'PREVIEW'
  const border = mode === 'program' ? 'border-rose-500/70' : 'border-sky-500/70'

  return (
    <div className={`overflow-hidden rounded-lg border ${border} bg-black shadow-lg shadow-black/30`}>
      <div className="flex items-center justify-between border-b border-white/10 bg-zinc-950 px-3 py-2">
        <span className={`text-xs font-black tracking-[0.2em] ${mode === 'program' ? 'text-rose-300' : 'text-sky-300'}`}>
          {label}
        </span>
        <span className="text-xs text-zinc-500">16:9</span>
      </div>
      <div className="aspect-video">
        <TimerDisplay state={state} tick={tick} compact label={label} />
      </div>
    </div>
  )
}
