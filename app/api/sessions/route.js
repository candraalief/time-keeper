import { NextResponse } from 'next/server'
import {
  createSession,
  deleteSession,
  listSessions,
  reorderSessions,
  updateSession,
} from '@/lib/sessions'
import { hasSupabaseConfig } from '@/lib/supabase'

function missingConfig() {
  return NextResponse.json(
    { success: false, error: 'Supabase is not configured' },
    { status: 500 }
  )
}

export async function GET() {
  try {
    if (!hasSupabaseConfig) return NextResponse.json({ success: true, sessions: [] })
    const sessions = await listSessions()
    return NextResponse.json({ success: true, sessions })
  } catch (err) {
    console.error('Sessions GET error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    if (!hasSupabaseConfig) return missingConfig()
    const body = await request.json()
    const session = await createSession(body)
    return NextResponse.json({ success: true, session })
  } catch (err) {
    console.error('Sessions POST error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    if (!hasSupabaseConfig) return missingConfig()
    const body = await request.json()

    if (Array.isArray(body.sessions)) {
      const sessions = await reorderSessions(body.sessions)
      return NextResponse.json({ success: true, sessions })
    }

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Session id is required' }, { status: 400 })
    }

    const session = await updateSession(body.id, body)
    return NextResponse.json({ success: true, session })
  } catch (err) {
    console.error('Sessions PUT error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    if (!hasSupabaseConfig) return missingConfig()
    const id = new URL(request.url).searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Session id is required' }, { status: 400 })
    }

    await deleteSession(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Sessions DELETE error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
