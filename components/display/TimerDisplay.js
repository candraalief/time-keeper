import RunningTicker from '@/components/display/RunningTicker'
import {
  DISPLAY_THEMES,
  SESSION_COLORS,
  clamp,
  formatDuration,
  normalizeTheme,
} from '@/lib/timer'

export default function TimerDisplay({
  state,
  tick,
  compact = false,
  label,
  connectionState,
}) {
  const theme = DISPLAY_THEMES[normalizeTheme(state.theme)]
  const remaining = tick?.remaining ?? state.remaining
  const overtime = Boolean(tick?.overtime || state.overtime || remaining < 0)
  const timerText = overtime
    ? formatDuration(Math.abs(remaining), { showSign: true })
    : formatDuration(Math.max(0, remaining))
  const progress = state.duration > 0
    ? clamp((Math.max(remaining, 0) / state.duration) * 100, 0, 100)
    : 0
  const title = state.sessionTitle
  const speaker = state.sessionSpeaker
  const color = SESSION_COLORS[state.sessionColor] ?? SESSION_COLORS.blue
  const isWarning = !overtime && remaining <= 30 && remaining > 0
  const isCaution = !overtime && remaining <= 120 && remaining > 30
  const timerClass =
    overtime || state.status === 'done'
      ? 'text-red-500 animate-soft-pulse'
      : isWarning
        ? 'text-red-400'
        : isCaution
          ? 'text-yellow-400'
          : 'text-emerald-400'
  const statusText =
    overtime || state.status === 'done'
      ? 'WAKTU HABIS'
      : state.status === 'paused'
        ? 'Dijeda'
        : state.status === 'running'
          ? ''
          : 'Menunggu sinyal dari Admin...'

  return (
    <section
      className={`${theme.frame} relative flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden transition-colors duration-500`}
    >
      <div
        className={`pointer-events-none absolute inset-0 transition-all duration-1000 ${
          overtime || state.status === 'done'
            ? 'bg-red-900 opacity-30'
            : isWarning
              ? 'bg-red-900 opacity-20'
              : isCaution
                ? 'bg-yellow-900 opacity-10'
                : 'opacity-0'
        }`}
      />

      <div className={`absolute left-4 top-4 z-10 max-w-[70%] ${compact ? 'hidden' : 'block'}`}>
        {(title || speaker) && (
          <div className="flex items-start gap-3 text-left">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
            <div className="min-w-0">
              {title && (
                <p className={`${theme.muted} truncate text-sm font-bold uppercase tracking-[0.18em]`}>
                  {title}
                </p>
              )}
              {speaker && (
                <p className={`${theme.subtle} mt-1 truncate text-xs font-medium`}>
                  {speaker}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={`absolute right-4 top-4 z-10 flex-col items-end gap-2 ${compact ? 'hidden' : 'flex'}`}>
        {connectionState && connectionState !== 'connected' && (
          <span className="rounded-md bg-black/40 px-2 py-1 text-xs font-semibold text-white/60">
            Reconnecting...
          </span>
        )}
        {label && (
          <span className="rounded-md bg-black/40 px-2 py-1 text-[10px] font-black tracking-[0.2em] text-white/70">
            {label}
          </span>
        )}
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div
          className={`select-none font-mono font-black leading-none tracking-normal transition-colors duration-500 ${timerClass}`}
          style={{
            fontSize: compact ? 'clamp(52px, 22vw, 110px)' : 'clamp(100px, 22vw, 320px)',
          }}
        >
          {timerText}
        </div>

        {statusText && (
          <p
            className={`mt-4 font-bold uppercase tracking-widest ${
              overtime || state.status === 'done'
                ? compact ? 'text-sm text-red-400' : 'text-3xl text-red-400'
                : compact ? 'text-xs text-gray-500' : 'text-xl text-gray-500'
            }`}
          >
            {statusText}
          </p>
        )}

        {state.duration > 0 && (
          <div className={`${compact ? 'mt-4 h-1 max-w-[80%]' : 'mt-8 h-1.5 max-w-2xl'} w-full overflow-hidden rounded-full bg-gray-800`}>
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                overtime || isWarning || state.status === 'done'
                  ? 'bg-red-500'
                  : isCaution
                    ? 'bg-yellow-400'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="relative z-10 w-full flex-shrink-0">
        <RunningTicker text={state.runningText} theme={theme} compact={compact} />
      </div>
    </section>
  )
}
