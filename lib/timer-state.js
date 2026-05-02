import { hasSupabaseConfig, supabase } from '@/lib/supabase'

const DEFAULT_TEXT_SIZE = 28

const DEFAULT_STATE = {
  id: null,
  status: 'idle',
  duration: 0,
  remaining: 0,
  endsAt: null,
  runningText: '',
  runningTextSize: DEFAULT_TEXT_SIZE,
}

const toClientState = (row) => ({
  id: row.id,
  status: row.status,
  duration: row.duration ?? 0,
  remaining: row.remaining ?? 0,
  endsAt: row.ends_at ? new Date(row.ends_at).getTime() : null,
  runningText: row.running_text ?? '',
  runningTextSize: row.running_text_size ?? DEFAULT_TEXT_SIZE,
})

const toRowState = (state) => ({
  status: state.status,
  duration: state.duration,
  remaining: state.remaining,
  ends_at: state.endsAt ? new Date(state.endsAt).toISOString() : null,
  running_text: state.runningText,
  running_text_size: state.runningTextSize,
  updated_at: new Date().toISOString(),
})

export async function getTimerState() {
  if (!hasSupabaseConfig) return DEFAULT_STATE

  const { data, error } = await supabase
    .from('timer_state')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return DEFAULT_STATE

  const state = toClientState(data)
  if (state.status === 'running' && state.endsAt) {
    const remaining = Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000))
    return {
      ...state,
      remaining,
      status: remaining > 0 ? 'running' : 'done',
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
        runningTextSize: Number.isFinite(payload.runningTextSize)
          ? payload.runningTextSize
          : current.runningTextSize,
      }
      break

    case 'pause':
      next = {
        ...current,
        status: 'paused',
        remaining: payload.remaining,
        endsAt: null,
      }
      break

    case 'resume':
      next = {
        ...current,
        status: 'running',
        remaining: payload.remaining,
        endsAt: payload.endsAt,
      }
      break

    case 'reset':
      next = {
        ...current,
        status: 'idle',
        duration: payload.duration,
        remaining: payload.duration,
        endsAt: null,
      }
      break

    case 'updateText':
      next = {
        ...current,
        runningText: payload.runningText ?? '',
        runningTextSize: Number.isFinite(payload.runningTextSize)
          ? payload.runningTextSize
          : current.runningTextSize,
      }
      break

    default:
      return current
  }

  const { data, error } = await supabase
    .from('timer_state')
    .insert(toRowState(next))
    .select('*')
    .single()

  if (error) throw error

  return toClientState(data)
}
