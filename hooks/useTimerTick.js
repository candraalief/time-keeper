'use client'

import { useEffect, useRef, useState } from 'react'
import { remainingFromEnd } from '@/lib/timer'

export function useTimerTick(timerState, onDone) {
  const doneRef = useRef(false)
  const [tick, setTick] = useState({
    remaining: timerState.remaining,
    overtime: timerState.overtime,
  })

  useEffect(() => {
    if (timerState.status !== 'running' || !timerState.endsAt) {
      doneRef.current = timerState.status === 'done'
      const timer = window.setTimeout(() => {
        setTick({
          remaining: timerState.remaining,
          overtime: timerState.overtime,
        })
      }, 0)
      return () => window.clearTimeout(timer)
    }

    doneRef.current = false

    const sync = () => {
      const remaining = remainingFromEnd(timerState.endsAt)
      const overtime = remaining < 0

      if (overtime && !doneRef.current) {
        doneRef.current = true
        onDone?.()
      }

      setTick({ remaining, overtime })
    }

    const firstSync = window.setTimeout(sync, 0)
    const interval = setInterval(sync, 250)
    return () => {
      window.clearTimeout(firstSync)
      clearInterval(interval)
    }
  }, [
    timerState.endsAt,
    timerState.overtime,
    timerState.remaining,
    timerState.status,
    onDone,
  ])

  return tick
}
