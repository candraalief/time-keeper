'use client'

import { useCallback, useEffect, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import TimerDisplay from '@/components/display/TimerDisplay'
import { usePusherControl } from '@/hooks/usePusher'
import { useTimerState } from '@/hooks/useTimerState'
import { useTimerTick } from '@/hooks/useTimerTick'

function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    const playTone = (freq, startTime, duration, gain = 0.75) => {
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      const comp = ctx.createDynamicsCompressor()

      osc.connect(env)
      env.connect(comp)
      comp.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.72, startTime + duration)

      env.gain.setValueAtTime(0.001, startTime)
      env.gain.linearRampToValueAtTime(gain, startTime + 0.01)
      env.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

      osc.start(startTime)
      osc.stop(startTime + duration)
    }

    playTone(523.25, ctx.currentTime, 1.8)
    playTone(659.25, ctx.currentTime + 0.45, 1.6)
    playTone(783.99, ctx.currentTime + 0.9, 2.2)
  } catch (error) {
    console.warn('Bell audio error:', error)
  }
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      return await navigator.wakeLock.request('screen')
    }
  } catch (error) {
    console.warn('Wake lock error:', error)
  }
  return null
}

export default function DisplayPage() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const { timerState, applyControl } = useTimerState({
    onError: (error) => console.error('Display state error:', error),
  })
  const connectionState = usePusherControl(applyControl)
  const tick = useTimerTick(timerState, playBell)

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const revealControls = useCallback(() => {
    setShowControls(true)
    window.clearTimeout(window.__displayControlsTimer)
    window.__displayControlsTimer = window.setTimeout(() => setShowControls(false), 3500)
  }, [])

  useEffect(() => {
    let wakeLock
    let cleanup = false

    const acquire = async () => {
      const lock = await requestWakeLock()
      if (!lock) return
      if (cleanup) lock.release()
      else wakeLock = lock
    }

    acquire()
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire()
    }
    const onFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement))
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() === 'f') toggleFullscreen()
    }

    document.addEventListener('visibilitychange', onVisible)
    document.addEventListener('fullscreenchange', onFullscreen)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      cleanup = true
      document.removeEventListener('visibilitychange', onVisible)
      document.removeEventListener('fullscreenchange', onFullscreen)
      window.removeEventListener('keydown', onKeyDown)
      wakeLock?.release()
    }
  }, [toggleFullscreen])

  useEffect(() => {
    const timer = window.setTimeout(() => revealControls(), 0)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(window.__displayControlsTimer)
    }
  }, [revealControls])

  return (
    <main
      className="h-screen w-screen overflow-hidden bg-black"
      onMouseMove={revealControls}
      onClick={revealControls}
    >
      <TimerDisplay
        state={timerState}
        tick={tick}
        connectionState={connectionState}
      />

      <button
        type="button"
        onClick={toggleFullscreen}
        className={`fixed right-5 top-5 z-20 rounded-lg border border-white/10 bg-black/40 p-3 text-white/70 backdrop-blur transition hover:text-white ${
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Toggle fullscreen"
      >
        {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
      </button>
    </main>
  )
}
