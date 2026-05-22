import { hasSupabaseConfig, supabase, withSupabaseTimeout } from '@/lib/supabase'

export const SESSION_SELECT = 'id,title,speaker,duration,order_index,color,notes,created_at'

export function toClientSession(row) {
  return {
    id: row.id,
    title: row.title,
    speaker: row.speaker ?? '',
    duration: row.duration ?? 600,
    orderIndex: row.order_index ?? 0,
    color: row.color ?? 'blue',
    notes: row.notes ?? '',
    createdAt: row.created_at,
  }
}

function toRowSession(session) {
  return {
    title: session.title,
    speaker: session.speaker ?? '',
    duration: Number(session.duration) || 600,
    order_index: Number(session.orderIndex ?? session.order_index) || 0,
    color: session.color ?? 'blue',
    notes: session.notes ?? '',
  }
}

export async function listSessions() {
  if (!hasSupabaseConfig) return []

  const { data, error } = await withSupabaseTimeout(
    supabase
      .from('seminar_sessions')
      .select(SESSION_SELECT)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true }),
    'Load sessions'
  )

  if (error) throw error
  return data.map(toClientSession)
}

export async function createSession(session) {
  const { data, error } = await withSupabaseTimeout(
    supabase
      .from('seminar_sessions')
      .insert(toRowSession(session))
      .select(SESSION_SELECT)
      .single(),
    'Create session'
  )

  if (error) throw error
  return toClientSession(data)
}

export async function updateSession(id, session) {
  const { data, error } = await withSupabaseTimeout(
    supabase
      .from('seminar_sessions')
      .update(toRowSession(session))
      .eq('id', id)
      .select(SESSION_SELECT)
      .single(),
    'Update session'
  )

  if (error) throw error
  return toClientSession(data)
}

export async function reorderSessions(sessions) {
  await withSupabaseTimeout(
    Promise.all(
      sessions.map((session, index) =>
        supabase
          .from('seminar_sessions')
          .update({ order_index: Number(session.orderIndex ?? index) })
          .eq('id', session.id)
      )
    ),
    'Reorder sessions'
  )

  return listSessions()
}

export async function deleteSession(id) {
  const { error } = await withSupabaseTimeout(
    supabase
      .from('seminar_sessions')
      .delete()
      .eq('id', id),
    'Delete session'
  )

  if (error) throw error
  return true
}
