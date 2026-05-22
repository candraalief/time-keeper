'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'

function ControlButton({ children, tone = 'secondary', className = '', ...props }) {
  const tones = {
    start: 'bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-emerald-900/50',
    pause: 'bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:bg-amber-900/50 disabled:text-white/40',
    reset: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 disabled:bg-zinc-900',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 disabled:bg-zinc-900',
  }

  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default function TimerControls({
  status,
  isSending,
  onStart,
  onPause,
  onResume,
  onReset,
}) {
  const running = status === 'running'
  const paused = status === 'paused'

  return (
    <div className="grid grid-cols-3 gap-2">
      {running ? (
        <ControlButton
          tone="pause"
          className="col-span-2"
          disabled={isSending}
          onClick={onPause}
        >
          <Pause size={18} />
          Pause
        </ControlButton>
      ) : (
        <ControlButton
          tone="start"
          className="col-span-2"
          disabled={isSending}
          onClick={paused ? onResume : onStart}
        >
          <Play size={18} />
          {paused ? 'Resume' : 'Start'}
        </ControlButton>
      )}

      <ControlButton tone="reset" disabled={isSending} onClick={onReset}>
        <RotateCcw size={18} />
        Reset
      </ControlButton>
    </div>
  )
}
