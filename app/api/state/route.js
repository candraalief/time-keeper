import { NextResponse } from 'next/server'
import { getTimerState } from '@/lib/timer-state'

export async function GET() {
  try {
    const state = await getTimerState()
    return NextResponse.json({ success: true, state })
  } catch (err) {
    console.error('Timer state error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
