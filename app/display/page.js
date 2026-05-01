'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Pusher from 'pusher-js'
import { Maximize2, Minimize2 } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (s) => {
  const m = Math.floor(Math.abs(s) / 60)
  const sec = Math.abs(s) % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// ─── Bell Sound via Web Audio API ────────────────────────────────────────────
function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    const playTone = (freq, startTime, duration, gain = 0.8) => {
      const osc  = ctx.createOscillator()
      const env  = ctx.createGain()
      const comp = ctx.createDynamicsCompressor()

      osc.connect(env)
      env.connect(comp)
      comp.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, startTime + duration)

      env.gain.setValueAtTime(0, startTime)
      env.gain.linearRampToValueAtTime(gain, startTime + 0.01)
      env.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

      osc.start(startTime)
      osc.stop(startTime + duration)
    }

    // Three-bell chime: C5, E5, G5
    playTone(523.25, ctx.currentTime,       2.5)
    playTone(659.25, ctx.currentTime + 0.6, 2.0)
    playTone(783.99, ctx.currentTime + 1.2, 3.0)
  } catch (e) {
    console.warn('Bell audio error:', e)
  }
}

// ─── Screen Wake Lock ─────────────────────────────────────────────────────────
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      const wakeLock = await navigator.wakeLock.request('screen')
      console.log('Wake Lock: active')
      return wakeLock
    }
  } catch (e) {
    console.warn('Wake Lock error:', e)
  }
  return null
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function DisplayPage() {
  const [remaining,   setRemaining]   = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [status,      setStatus]      = useState('idle')   // idle | running | paused | done
  const [runningText, setRunningText] = useState('Selamat Datang — Seminar Timekeeper')
  const [isFullscreen,setIsFullscreen]= useState(false)
  const [showControls,setShowControls]= useState(true)

  const intervalRef  = useRef(null)
  const wakeLockRef  = useRef(null)
  const hideTimerRef = useRef(null)

  // ── Wake Lock setup ──────────────────────────────────────────────────────
  useEffect(() => {
    let cleanupRequested = false

    const acquireWakeLock = async () => {
      const wakeLock = await requestWakeLock()
      if (!wakeLock) return

      if (cleanupRequested) {
        wakeLock.release()
      } else {
        wakeLockRef.current = wakeLock
      }
    }

    acquireWakeLock()

    const onVisible = () => {
      if (document.visibilityState === 'visible') acquireWakeLock()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cleanupRequested = true
      document.removeEventListener('visibilitychange', onVisible)
      const wakeLock = wakeLockRef.current
      wakeLockRef.current = null
      if (wakeLock) wakeLock.release()
    }
  }, [])

  // ── Auto-hide controls on idle ───────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setShowControls(false), 4000)
  }, [])

  useEffect(() => {
    hideTimerRef.current = setTimeout(() => setShowControls(false), 4000)
    return () => clearTimeout(hideTimerRef.current)
  }, [])

  // ── Fullscreen toggle ────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ── Countdown logic (local) ──────────────────────────────────────────────
  const startTick = useCallback((startRemaining) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    let rem = startRemaining
    intervalRef.current = setInterval(() => {
      rem--
      if (rem <= 0) {
        clearInterval(intervalRef.current)
        setRemaining(0)
        setStatus('done')
        playBell()
      } else {
        setRemaining(rem)
      }
    }, 1000)
  }, [])

  const stopTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => () => stopTick(), [])

  // ── Pusher subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    })

    const channel = pusher.subscribe('seminar-timer')

    channel.bind('control', (data) => {
      switch (data.action) {
        case 'start':
          stopTick()
          setDuration(data.duration)
          setRemaining(data.duration)
          setStatus('running')
          if (data.runningText) setRunningText(data.runningText)
          startTick(data.duration)
          break

        case 'pause':
          stopTick()
          setRemaining(data.remaining)
          setStatus('paused')
          break

        case 'resume':
          setRemaining(data.remaining)
          setStatus('running')
          startTick(data.remaining)
          break

        case 'reset':
          stopTick()
          setDuration(data.duration)
          setRemaining(data.duration)
          setStatus('idle')
          break

        case 'updateText':
          setRunningText(data.runningText ?? '')
          break

        default:
          break
      }
    })

    return () => {
      pusher.disconnect()
      stopTick()
    }
  }, [startTick])

  // ── Color scheme ─────────────────────────────────────────────────────────
  const isDone    = status === 'done'
  const isWarning = !isDone && remaining <= 30  && remaining > 0
  const isCaution = !isDone && remaining <= 120 && remaining > 30

  const bgClass    = isDone    ? 'bg-gray-950' : isWarning ? 'bg-gray-950' : 'bg-gray-950'
  const timerClass =
    isDone    ? 'text-red-500 animate-blink' :
    isWarning ? 'text-red-400' :
    isCaution ? 'text-yellow-400' :
                'text-emerald-400'

  const statusText =
    isDone           ? '⏰  WAKTU HABIS!' :
    status === 'running' ? '' :
    status === 'paused'  ? '⏸  Dijeda' :
                            'Menunggu sinyal dari Admin…'

  const progress = duration > 0 ? (remaining / duration) * 100 : 0

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`relative min-h-screen ${bgClass} flex flex-col items-center justify-center no-select overflow-hidden`}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
    >
      {/* ── Background glow ── */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-1000 ${
          isDone    ? 'opacity-30 bg-red-900' :
          isWarning ? 'opacity-20 bg-red-900' :
          isCaution ? 'opacity-10 bg-yellow-900' :
                      'opacity-0'
        }`}
      />

      {/* ── Fullscreen button ── */}
      <button
        onClick={toggleFullscreen}
        className={`absolute top-4 right-4 p-2 rounded-lg text-white/30 hover:text-white/80 transition-all ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {isFullscreen ? <Minimize2 size={28} /> : <Maximize2 size={28} />}
      </button>

      {/* ── Main timer ── */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
        <div
          className={`font-mono font-black leading-none ${timerClass} transition-colors duration-500 select-none`}
          style={{ fontSize: 'clamp(100px, 22vw, 320px)' }}
        >
          {fmt(remaining)}
        </div>

        {/* Status label */}
        {statusText && (
          <p
            className={`mt-4 font-bold tracking-widest uppercase ${isDone ? 'text-red-400 animate-blink text-3xl' : 'text-gray-500 text-xl'}`}
          >
            {statusText}
          </p>
        )}

        {/* Progress bar */}
        {duration > 0 && (
          <div className="w-full max-w-2xl mt-8 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isDone || isWarning ? 'bg-red-500' :
                isCaution ? 'bg-yellow-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Running Text ── */}
      {runningText && (
        <div className="w-full bg-black/60 border-t border-white/10 py-3 overflow-hidden flex-shrink-0">
          <div className="marquee-text text-white text-2xl md:text-3xl font-semibold tracking-wide px-4">
            {runningText}
            &ensp;·&ensp;
            {runningText}
            &ensp;·&ensp;
            {runningText}
          </div>
        </div>
      )}
    </div>
  )
}
