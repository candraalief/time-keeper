import { hasSupabaseConfig, supabase, withSupabaseTimeout } from '@/lib/supabase'
import { normalizeTheme, normalizeTimerState, remainingFromEnd } from '@/lib/timer'

const DEFAULT_STATE = normalizeTimerState()

function toClientState(row) {
  return normalizeTimerState({
    id: row.id,
    status: row.status,
    duration: row.duration,
    remaining: row.remaining,
    endsAt: row.ends_at ? new Date(row.ends_at).getTime() : null,
    runningText: row.running_text,
    theme: row.theme,
    sessionId: row.session_id,
    sessionTitle: row.session_title,
    sessionSpeaker: row.session_speaker,
    sessionColor: row.session_color,
    overtime: row.overtime,
  })
}

function toRowState(state) {
  return {
    id: 1,
    status: state.status,
    duration: state.duration,
    remaining: state.remaining,
    ends_at: state.endsAt ? new Date(state.endsAt).toISOString() : null,
    running_text: state.runningText,
    theme: normalizeTheme(state.theme),
    session_id: state.sessionId,
    session_title: state.sessionTitle,
    session_speaker: state.sessionSpeaker,
    session_color: state.sessionColor,
    overtime: state.overtime,
    updated_at: new Date().toISOString(),
  }
}

export async function getTimerState() {
  if (!hasSupabaseConfig) return DEFAULT_STATE

  const { data, error } = await withSupabaseTimeout(
    supabase
      .from('timer_state')
      .select('*')
      .eq('id', 1)
      .maybeSingle(),
    'Load timer state'
  )

  if (error) throw error
  if (!data) return DEFAULT_STATE

  const state = toClientState(data)
  if (state.status === 'running' && state.endsAt) {
    const remaining = remainingFromEnd(state.endsAt)
    return {
      ...state,
      remaining,
      overtime: remaining < 0,
    }
  }

  return state
}

export async function saveTimerStateFromPayload(payload) {
  if (!hasSupabaseConfig) return null

  const current = await getTimerState()
  let next = current

  switch (payload.action) {
    case 'start':
      next = {
        ...current,
        status: 'running',
        duration: payload.duration,
        remaining: payload.duration,
        endsAt: payload.endsAt,
        runningText: payload.runningText ?? current.runningText,
        theme: normalizeTheme(payload.theme ?? current.theme),
        sessionId: payload.sessionId ?? current.sessionId,
        sessionTitle: payload.sessionTitle ?? current.sessionTitle,
        sessionSpeaker: payload.sessionSpeaker ?? current.sessionSpeaker,
        sessionColor: payload.sessionColor ?? current.sessionColor,
        overtime: false,
      }
      break

    case 'pause':
      next = {
        ...current,
        status: 'paused',
        remaining: payload.remaining,
        endsAt: null,
        overtime: Number(payload.remaining) < 0,
      }
      break

    case 'resume':
      next = {
        ...current,
        status: 'running',
        remaining: payload.remaining,
        endsAt: payload.endsAt,
        overtime: Number(payload.remaining) < 0,
      }
      break

    case 'reset':
      next = {
        ...current,
        status: 'idle',
        duration: payload.duration ?? current.duration,
        remaining: payload.duration ?? current.duration,
        endsAt: null,
        overtime: false,
      }
      break

    case 'updateText':
      next = {
        ...current,
        runningText: payload.runningText ?? '',
      }
      break

    case 'updateTheme':
      next = {
        ...current,
        theme: normalizeTheme(payload.theme),
      }
      break

    case 'loadSession':
      next = {
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
      }
      break

    case 'take':
      next = {
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
      }
      break

    case 'overtime':
      next = {
        ...current,
        overtime: true,
        remaining: -Math.abs(Number(payload.elapsedOvertime) || Math.abs(current.remaining)),
      }
      break

    default:
      return current
  }

  const { data, error } = await withSupabaseTimeout(
    supabase
      .from('timer_state')
      .upsert(toRowState(normalizeTimerState(next)), { onConflict: 'id' })
      .select('*')
      .single(),
    'Save timer state'
  )

  if (error) throw error

  return toClientState(data)
}
