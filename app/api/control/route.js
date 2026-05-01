import { NextResponse } from 'next/server'
import pusher from '@/lib/pusher'

export async function POST(request) {
  try {
    const body = await request.json()
    await pusher.trigger('seminar-timer', 'control', body)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Pusher trigger error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
