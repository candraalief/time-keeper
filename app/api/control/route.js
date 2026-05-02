import { NextResponse } from 'next/server'
import pusher from '@/lib/pusher'

export async function POST(request) {
  try {
    const body = await request.json()
    const payload = { ...body }
    const now = Date.now()

    if (payload.action === 'start' && Number.isFinite(payload.duration)) {
      payload.startedAt = now
      payload.endsAt = now + payload.duration * 1000
    }

    if (payload.action === 'resume' && Number.isFinite(payload.remaining)) {
      payload.resumedAt = now
      payload.endsAt = now + payload.remaining * 1000
    }

    await pusher.trigger('seminar-timer', 'control', payload)
    return NextResponse.json({ success: true, payload })
  } catch (err) {
    console.error('Pusher trigger error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
