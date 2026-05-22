import { STATUS_LABELS } from '@/lib/timer'

export default function OverlayStatus({ status, overtime = false, compact = false }) {
  const label = overtime ? 'OVERTIME' : STATUS_LABELS[status] ?? 'READY'
  const tone = overtime || status === 'done'
    ? 'border-rose-400/40 bg-rose-500/15 text-rose-200'
    : status === 'running'
      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
      : status === 'paused'
        ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
        : 'border-white/15 bg-white/8 text-white/70'

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${tone} ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-4 py-1.5 text-sm'
      } font-black tracking-[0.16em]`}
    >
      <span className={`rounded-full ${compact ? 'h-1.5 w-1.5' : 'h-2 w-2'} ${
        overtime || status === 'done'
          ? 'bg-rose-300'
          : status === 'running'
            ? 'bg-emerald-300'
            : status === 'paused'
              ? 'bg-amber-300'
              : 'bg-white/40'
      }`} />
      {label}
    </div>
  )
}
