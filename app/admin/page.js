'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Pusher from 'pusher-js'
import {
  Play, Pause, RotateCcw, Wifi, WifiOff,
  Send, ChevronUp, ChevronDown, Home
} from 'lucide-react'
import Link from 'next/link'

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (s) => {
  const m = Math.floor(Math.abs(s) / 60)
  const sec = Math.abs(s) % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
const remainingFromEnd = (endsAt) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  // Input state
  const [inputMinutes, setInputMinutes] = useState(10)
  const [inputSeconds, setInputSeconds] = useState(0)
  const [runningText, setRunningText]   = useState('')

  // Timer state (local mirror for admin UI)
  const [timerStatus, setTimerStatus]   = useState('idle')  // idle | running | paused
  const [remaining, setRemaining]       = useState(0)
  const [duration, setDuration]         = useState(0)

  // Connection
  const [isConnected, setIsConnected]   = useState(false)
  const [isSending, setIsSending]       = useState(false)

  const intervalRef   = useRef(null)
  const remainingRef  = useRef(0)
  const endsAtRef     = useRef(null)
  const didMountRef   = useRef(false)
  const lastTextRef   = useRef(runningText)

  useEffect(() => { remainingRef.current = remaining }, [remaining])

  // ── Pusher: subscribe so admin also mirrors display state ──────────────────
  // ── Local countdown so admin screen reflects timer ─────────────────────────
  const startLocalTick = useCallback((endsAt) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    endsAtRef.current = endsAt

    const syncRemaining = () => {
      const rem = remainingFromEnd(endsAt)
      if (rem <= 0) {
        clearInterval(intervalRef.current)
        setTimerStatus('idle')
      }
      setRemaining(rem)
      remainingRef.current = rem
    }

    syncRemaining()
    intervalRef.current = setInterval(syncRemaining, 250)
  }, [])

  const stopLocalTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => () => stopLocalTick(), [])

  const currentRemaining = useCallback(() => {
    if (timerStatus === 'running' && endsAtRef.current) {
      return remainingFromEnd(endsAtRef.current)
    }
    return remainingRef.current
  }, [timerStatus])

  const applyControl = useCallback((data) => {
    switch (data.action) {
      case 'start': {
        const endsAt = data.endsAt ?? Date.now() + data.duration * 1000
        setDuration(data.duration)
        setRemaining(remainingFromEnd(endsAt))
        setTimerStatus('running')
        if (data.runningText !== undefined) setRunningText(data.runningText)
        startLocalTick(endsAt)
        break
      }

      case 'pause':
        stopLocalTick()
        endsAtRef.current = null
        setRemaining(data.remaining)
        setTimerStatus('paused')
        break

      case 'resume': {
        const endsAt = data.endsAt ?? Date.now() + data.remaining * 1000
        setRemaining(remainingFromEnd(endsAt))
        setTimerStatus('running')
        startLocalTick(endsAt)
        break
      }

      case 'reset':
        stopLocalTick()
        endsAtRef.current = null
        setDuration(data.duration)
        setRemaining(data.duration)
        setTimerStatus('idle')
        break

      case 'updateText':
        setRunningText(data.runningText ?? '')
        lastTextRef.current = data.runningText ?? ''
        break

      default:
        break
    }
  }, [startLocalTick])

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    })

    pusher.connection.bind('connected',    () => setIsConnected(true))
    pusher.connection.bind('disconnected', () => setIsConnected(false))
    pusher.connection.bind('error',        () => setIsConnected(false))

    const channel = pusher.subscribe('seminar-timer')
    channel.bind('control', applyControl)

    return () => pusher.disconnect()
  }, [applyControl])

  // ── API helpers ────────────────────────────────────────────────────────────
  const broadcast = async (payload) => {
    setIsSending(true)
    try {
      await fetch('/api/control', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
    } catch (e) {
      console.error('Broadcast error:', e)
    } finally {
      setIsSending(false)
    }
  }

  // ── Controls ───────────────────────────────────────────────────────────────
  const handleStart = () => {
    const totalSec = inputMinutes * 60 + inputSeconds
    if (totalSec <= 0) return
    const endsAt = Date.now() + totalSec * 1000
    setDuration(totalSec)
    setRemaining(totalSec)
    setTimerStatus('running')
    startLocalTick(endsAt)
    broadcast({ action: 'start', duration: totalSec, runningText })
  }

  const handleResume = () => {
    const rem = currentRemaining()
    const endsAt = Date.now() + rem * 1000
    setTimerStatus('running')
    startLocalTick(endsAt)
    broadcast({ action: 'resume', remaining: rem })
  }

  const handlePause = () => {
    const rem = currentRemaining()
    stopLocalTick()
    endsAtRef.current = null
    setTimerStatus('paused')
    setRemaining(rem)
    broadcast({ action: 'pause', remaining: rem })
  }

  const handleReset = () => {
    stopLocalTick()
    endsAtRef.current = null
    const totalSec = inputMinutes * 60 + inputSeconds
    setDuration(totalSec)
    setRemaining(totalSec)
    setTimerStatus('idle')
    broadcast({ action: 'reset', duration: totalSec })
  }

  const handleSendText = () => {
    lastTextRef.current = runningText
    broadcast({ action: 'updateText', runningText })
  }

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    const sendTimer = setTimeout(() => {
      if (runningText === lastTextRef.current) return
      lastTextRef.current = runningText
      broadcast({ action: 'updateText', runningText })
    }, 500)

    return () => clearTimeout(sendTimer)
  }, [runningText])

  // ── Spinners ───────────────────────────────────────────────────────────────
  const adjustMinutes = (delta) => setInputMinutes(v => clamp(v + delta, 0, 999))
  const adjustSeconds = (delta) => setInputSeconds(v => {
    const n = v + delta
    if (n < 0)  { adjustMinutes(-1); return 59 }
    if (n > 59) { adjustMinutes(1);  return 0  }
    return n
  })

  // ── Progress ───────────────────────────────────────────────────────────────
  const progress = duration > 0 ? (remaining / duration) * 100 : 0

  // ── Color hint ─────────────────────────────────────────────────────────────
  const colorHint =
    timerStatus === 'idle'
      ? 'text-gray-400'
      : remaining <= 30
      ? 'text-red-400'
      : remaining <= 120
      ? 'text-yellow-400'
      : 'text-emerald-400'

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white pb-8">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur border-b border-gray-800 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <Home size={20} />
          </Link>
          <h1 className="text-lg font-bold">Dashboard Admin</h1>
        </div>
        <div
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full
            ${isConnected
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-red-950 text-red-400 border border-red-800'}`}
        >
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isConnected ? 'Online' : 'Offline'}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-4">

        {/* ── Timer Preview (mini) ── */}
        <div className="bg-gray-900 rounded-2xl p-5 text-center border border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Sisa Waktu</p>
          <div className={`text-6xl font-black font-mono ${colorHint}`}>
            {fmt(remaining)}
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                remaining <= 30 ? 'bg-red-500' :
                remaining <= 120 ? 'bg-yellow-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1.5">
            {timerStatus === 'idle'    && 'Belum dimulai'}
            {timerStatus === 'running' && '▶ Berjalan'}
            {timerStatus === 'paused'  && '⏸ Dijeda'}
          </p>
        </div>

        {/* ── Duration Setter ── */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <p className="text-sm font-semibold text-gray-400 mb-4">Atur Durasi</p>
          <div className="flex items-center justify-center gap-4">
            {/* Minutes */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => adjustMinutes(1)}  className="p-2 rounded-lg hover:bg-gray-800 active:bg-gray-700"><ChevronUp  size={20} /></button>
              <input
                type="number"
                value={inputMinutes}
                onChange={e => setInputMinutes(clamp(parseInt(e.target.value) || 0, 0, 999))}
                className="w-24 bg-gray-800 text-white text-4xl font-black text-center py-2 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
              <button onClick={() => adjustMinutes(-1)} className="p-2 rounded-lg hover:bg-gray-800 active:bg-gray-700"><ChevronDown size={20} /></button>
              <span className="text-xs text-gray-500">Menit</span>
            </div>

            <span className="text-5xl font-black text-gray-500 pb-4">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => adjustSeconds(1)}  className="p-2 rounded-lg hover:bg-gray-800 active:bg-gray-700"><ChevronUp  size={20} /></button>
              <input
                type="number"
                value={inputSeconds}
                onChange={e => setInputSeconds(clamp(parseInt(e.target.value) || 0, 0, 59))}
                className="w-24 bg-gray-800 text-white text-4xl font-black text-center py-2 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
              <button onClick={() => adjustSeconds(-1)} className="p-2 rounded-lg hover:bg-gray-800 active:bg-gray-700"><ChevronDown size={20} /></button>
              <span className="text-xs text-gray-500">Detik</span>
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Start / Resume */}
          {timerStatus !== 'running' ? (
            <button
              onClick={timerStatus === 'paused' ? handleResume : handleStart}
              disabled={isSending}
              className="col-span-2 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white py-5 rounded-2xl text-lg font-bold transition-all shadow-lg shadow-emerald-900/30"
            >
              <Play size={22} />
              {timerStatus === 'paused' ? 'Lanjutkan' : 'Mulai'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              disabled={isSending}
              className="col-span-2 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 disabled:opacity-50 text-white py-5 rounded-2xl text-lg font-bold transition-all shadow-lg shadow-yellow-900/30"
            >
              <Pause size={22} />
              Jeda
            </button>
          )}

          {/* Reset */}
          <button
            onClick={handleReset}
            disabled={isSending}
            className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 disabled:opacity-50 text-white py-5 rounded-2xl text-lg font-bold transition-all"
          >
            <RotateCcw size={22} />
          </button>
        </div>

        {/* ── Quick Durations ── */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest">Durasi Cepat</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '5m',  m: 5,  s: 0 },
              { label: '10m', m: 10, s: 0 },
              { label: '15m', m: 15, s: 0 },
              { label: '20m', m: 20, s: 0 },
              { label: '30m', m: 30, s: 0 },
              { label: '45m', m: 45, s: 0 },
              { label: '60m', m: 60, s: 0 },
              { label: '90m', m: 90, s: 0 },
            ].map(({ label, m, s }) => (
              <button
                key={label}
                onClick={() => { setInputMinutes(m); setInputSeconds(s) }}
                className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white text-sm font-semibold py-2 rounded-xl transition-all"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Running Text ── */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <p className="text-sm font-semibold text-gray-400 mb-3">Teks Berjalan (Running Text)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={runningText}
              onChange={e => setRunningText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendText()}
              placeholder="Nama pembicara atau pengumuman..."
              className="flex-1 bg-gray-800 text-white placeholder-gray-600 px-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
            />
            <button
              onClick={handleSendText}
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 p-3 rounded-xl transition-all"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">Tekan Enter atau klik kirim untuk update teks di layar display.</p>
          <p className="text-xs text-gray-600 mt-1">Perubahan juga terkirim otomatis saat kamu mengetik.</p>
        </div>

      </div>
    </div>
  )
}
