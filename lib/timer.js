export const DEFAULT_THEME = 'dark'
export const DEFAULT_EVENT_TITLE = 'Seminar Timekeeper'

export const DISPLAY_THEMES = {
  dark: {
    name: 'Dark',
    frame: 'bg-gray-950 text-white',
    surface: 'bg-white/5 border-white/10',
    muted: 'text-gray-500',
    subtle: 'text-gray-600',
    accent: 'text-sky-300',
    accentBg: 'bg-sky-400',
    progressBg: 'bg-gray-800',
    ticker: 'bg-black/60 border-white/10 text-white',
  },
  light: {
    name: 'Light',
    frame: 'bg-slate-50 text-slate-950',
    surface: 'bg-slate-900/5 border-slate-900/10',
    muted: 'text-slate-700',
    subtle: 'text-slate-500',
    accent: 'text-blue-700',
    accentBg: 'bg-blue-600',
    progressBg: 'bg-slate-200',
    ticker: 'bg-slate-950 text-white border-slate-800',
  },
  minimal: {
    name: 'Minimal',
    frame: 'bg-black text-white',
    surface: 'bg-white/0 border-white/10',
    muted: 'text-zinc-300',
    subtle: 'text-zinc-500',
    accent: 'text-white',
    accentBg: 'bg-white',
    progressBg: 'bg-white/10',
    ticker: 'bg-black/70 border-white/10 text-white',
  },
  warm: {
    name: 'Warm',
    frame: 'bg-[#21140b] text-amber-50',
    surface: 'bg-amber-100/5 border-amber-100/10',
    muted: 'text-amber-100/75',
    subtle: 'text-amber-100/50',
    accent: 'text-amber-300',
    accentBg: 'bg-amber-400',
    progressBg: 'bg-amber-100/10',
    ticker: 'bg-black/35 border-amber-100/10 text-amber-50',
  },
}

export const SESSION_COLORS = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  cyan: 'bg-cyan-500',
  slate: 'bg-slate-500',
}

export const STATUS_LABELS = {
  idle: 'READY',
  running: 'RUNNING',
  paused: 'PAUSED',
  done: 'DONE',
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function remainingFromEnd(endsAt) {
  if (!endsAt) return 0
  return Math.ceil((Number(endsAt) - Date.now()) / 1000)
}

export function formatDuration(totalSeconds, { showSign = false } = {}) {
  const sign = showSign && totalSeconds > 0 ? '+' : ''
  const abs = Math.abs(totalSeconds)
  const minutes = Math.floor(abs / 60)
  const seconds = abs % 60
  return `${sign}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function secondsToParts(totalSeconds) {
  const value = Math.max(0, Number(totalSeconds) || 0)
  return {
    minutes: Math.floor(value / 60),
    seconds: value % 60,
  }
}

export function partsToSeconds(minutes, seconds) {
  return Math.max(0, (Number(minutes) || 0) * 60 + (Number(seconds) || 0))
}

export function normalizeTheme(theme) {
  return DISPLAY_THEMES[theme] ? theme : DEFAULT_THEME
}

export function normalizeTimerState(state = {}) {
  return {
    id: state.id ?? 1,
    status: state.status ?? 'idle',
    duration: Number(state.duration) || 0,
    remaining: Number(state.remaining) || 0,
    endsAt: state.endsAt ?? null,
    runningText: state.runningText ?? '',
    theme: normalizeTheme(state.theme),
    sessionId: state.sessionId ?? null,
    sessionTitle: state.sessionTitle ?? '',
    sessionSpeaker: state.sessionSpeaker ?? '',
    sessionColor: state.sessionColor ?? 'blue',
    overtime: Boolean(state.overtime),
  }
}

export function applyControlToState(currentState, payload) {
  const current = normalizeTimerState(currentState)

  switch (payload.action) {
    case 'start':
      return normalizeTimerState({
        ...current,
        status: 'running',
        duration: payload.duration,
        remaining: payload.duration,
        endsAt: payload.endsAt ?? Date.now() + payload.duration * 1000,
        runningText: payload.runningText ?? current.runningText,
        theme: normalizeTheme(payload.theme ?? current.theme),
        sessionId: payload.sessionId ?? current.sessionId,
        sessionTitle: payload.sessionTitle ?? current.sessionTitle,
        sessionSpeaker: payload.sessionSpeaker ?? current.sessionSpeaker,
        sessionColor: payload.sessionColor ?? current.sessionColor,
        overtime: false,
      })

    case 'pause':
      return normalizeTimerState({
        ...current,
        status: 'paused',
        remaining: payload.remaining,
        endsAt: null,
        overtime: Number(payload.remaining) < 0,
      })

    case 'resume':
      return normalizeTimerState({
        ...current,
        status: 'running',
        remaining: payload.remaining,
        endsAt: payload.endsAt ?? Date.now() + payload.remaining * 1000,
        overtime: Number(payload.remaining) < 0,
      })

    case 'reset':
      return normalizeTimerState({
        ...current,
        status: 'idle',
        duration: payload.duration ?? current.duration,
        remaining: payload.duration ?? current.duration,
        endsAt: null,
        overtime: false,
      })

    case 'updateText':
      return normalizeTimerState({
        ...current,
        runningText: payload.runningText ?? '',
      })

    case 'updateTheme':
      return normalizeTimerState({
        ...current,
        theme: normalizeTheme(payload.theme),
      })

    case 'loadSession':
      return normalizeTimerState({
        ...current,
        status: 'idle',
        duration: payload.duration,
        remaining: payload.duration,
        endsAt: null,
        sessionId: payload.sessionId ?? null,
        sessionTitle: payload.title ?? '',
        sessionSpeaker: payload.speaker ?? '',
        sessionColor: payload.color ?? 'blue',
        overtime: false,
      })

    case 'take':
      return normalizeTimerState({
        ...current,
        duration: payload.duration ?? current.duration,
        remaining: Number.isFinite(payload.duration)
          ? payload.duration
          : current.remaining,
        endsAt: current.status === 'running' && Number.isFinite(payload.duration)
          ? Date.now() + payload.duration * 1000
          : current.endsAt,
        runningText: payload.runningText ?? current.runningText,
        theme: normalizeTheme(payload.theme ?? current.theme),
        sessionTitle: payload.sessionTitle ?? current.sessionTitle,
        sessionSpeaker: payload.sessionSpeaker ?? current.sessionSpeaker,
        sessionColor: payload.sessionColor ?? current.sessionColor,
        overtime: false,
      })

    case 'overtime':
      return normalizeTimerState({
        ...current,
        overtime: true,
        remaining: -Math.abs(Number(payload.elapsedOvertime) || Math.abs(current.remaining)),
      })

    default:
      return current
  }
}
