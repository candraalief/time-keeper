'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  ChevronUp,
  Home,
  Monitor,
  Send,
  Settings2,
} from 'lucide-react'
import AgendaPanel from '@/components/admin/AgendaPanel'
import MiniDisplay from '@/components/admin/MiniDisplay'
import RunningTextInput from '@/components/admin/RunningTextInput'
import SessionForm from '@/components/admin/SessionForm'
import TimerControls from '@/components/admin/TimerControls'
import ConnectionStatus from '@/components/shared/ConnectionStatus'
import ToastStack from '@/components/shared/Toast'
import { usePusherControl } from '@/hooks/usePusher'
import { useTimerState } from '@/hooks/useTimerState'
import { useTimerTick } from '@/hooks/useTimerTick'
import {
  DEFAULT_EVENT_TITLE,
  DISPLAY_THEMES,
  clamp,
  formatDuration,
  normalizeTimerState,
  partsToSeconds,
  secondsToParts,
} from '@/lib/timer'

function useToasts() {
  const [toasts, setToasts] = useState([])

  const pushToast = useCallback((toast) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, type: 'info', ...toast }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 4200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  return { toasts, pushToast, dismissToast }
}

export default function AdminPage() {
  const { toasts, pushToast, dismissToast } = useToasts()
  const {
    timerState,
    applyControl,
    sendControl,
    isSending,
  } = useTimerState({
    onError: (error) => pushToast({ type: 'error', title: 'Timer error', message: error.message }),
  })
  const connectionState = usePusherControl(applyControl)
  const programTick = useTimerTick(timerState)

  const [eventTitle, setEventTitle] = useState(DEFAULT_EVENT_TITLE)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draftState, setDraftState] = useState(() => normalizeTimerState())
  const [isDirty, setIsDirty] = useState(false)
  const [sessions, setSessions] = useState([])
  const [sessionForm, setSessionForm] = useState(null)
  const [isSavingSession, setIsSavingSession] = useState(false)
  const previewTick = useTimerTick(draftState)

  const durationParts = secondsToParts(draftState.duration)
  const previewChanged = isDirty || draftState.runningText !== timerState.runningText || draftState.theme !== timerState.theme

  useEffect(() => {
    const savedTitle = window.localStorage.getItem('seminar-event-title')
    if (!savedTitle) return undefined
    const timer = window.setTimeout(() => setEventTitle(savedTitle), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('seminar-event-title', eventTitle)
  }, [eventTitle])

  useEffect(() => {
    if (isDirty) return undefined
    const timer = window.setTimeout(() => setDraftState(timerState), 0)
    return () => window.clearTimeout(timer)
  }, [isDirty, timerState])

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to load sessions')
      setSessions(result.sessions)
    } catch (error) {
      pushToast({ type: 'error', title: 'Agenda error', message: error.message })
    }
  }, [pushToast])

  useEffect(() => {
    const timer = window.setTimeout(() => fetchSessions(), 0)
    return () => window.clearTimeout(timer)
  }, [fetchSessions])

  const updateDraft = (updates) => {
    setDraftState((current) => normalizeTimerState({ ...current, ...updates }))
    setIsDirty(true)
  }

  const changeDuration = (part, value) => {
    const nextDuration = part === 'minutes'
      ? partsToSeconds(value, durationParts.seconds)
      : partsToSeconds(durationParts.minutes, clamp(value, 0, 59))
    updateDraft({
      status: 'idle',
      duration: nextDuration,
      remaining: nextDuration,
      endsAt: null,
      overtime: false,
    })
  }

  const currentRemaining = () => programTick.remaining

  const send = async (payload, successTitle) => {
    try {
      await sendControl(payload)
      pushToast({ type: 'success', title: successTitle })
    } catch (error) {
      pushToast({ type: 'error', title: 'Request failed', message: error.message })
    }
  }

  const payloadFromDraft = useMemo(() => ({
    duration: draftState.duration,
    runningText: draftState.runningText,
    theme: draftState.theme,
    sessionId: draftState.sessionId,
    sessionTitle: draftState.sessionTitle,
    sessionSpeaker: draftState.sessionSpeaker,
    sessionColor: draftState.sessionColor,
  }), [draftState])

  const handleStart = () => {
    if (draftState.duration <= 0) return
    setIsDirty(false)
    send({ action: 'start', ...payloadFromDraft }, 'Program started')
  }

  const handlePause = () => {
    send({ action: 'pause', remaining: currentRemaining() }, 'Program paused')
  }

  const handleResume = () => {
    send({ action: 'resume', remaining: currentRemaining() }, 'Program resumed')
  }

  const handleReset = () => {
    send({ action: 'reset', duration: draftState.duration }, 'Timer reset')
  }

  const handleTake = async () => {
    setIsDirty(false)
    await send({ action: 'take', ...payloadFromDraft }, 'Preview taken to program')
  }

  const handleLoadSession = (session) => {
    updateDraft({
      duration: session.duration,
      remaining: session.duration,
      sessionId: session.id,
      sessionTitle: session.title,
      sessionSpeaker: session.speaker,
      sessionColor: session.color,
      runningText: session.speaker ? `${session.title} - ${session.speaker}` : session.title,
    })
    pushToast({ type: 'info', title: 'Loaded to preview', message: session.title })
  }

  const handleSaveSession = async (form) => {
    setIsSavingSession(true)
    try {
      const response = await fetch('/api/sessions', {
        method: sessionForm?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          id: sessionForm?.id,
          orderIndex: sessionForm?.orderIndex ?? sessions.length,
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to save session')
      setSessionForm(null)
      await fetchSessions()
      pushToast({ type: 'success', title: 'Session saved' })
    } catch (error) {
      pushToast({ type: 'error', title: 'Session save failed', message: error.message })
    } finally {
      setIsSavingSession(false)
    }
  }

  const handleDeleteSession = async (session) => {
    if (!window.confirm(`Delete "${session.title}"?`)) return
    try {
      const response = await fetch(`/api/sessions?id=${session.id}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to delete session')
      await fetchSessions()
      pushToast({ type: 'success', title: 'Session deleted' })
    } catch (error) {
      pushToast({ type: 'error', title: 'Delete failed', message: error.message })
    }
  }

  const handleReorderSessions = async (nextSessions) => {
    setSessions(nextSessions)
    try {
      const response = await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: nextSessions }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to reorder sessions')
      setSessions(result.sessions)
    } catch (error) {
      pushToast({ type: 'error', title: 'Reorder failed', message: error.message })
      fetchSessions()
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {sessionForm !== null && (
        <SessionForm
          key={sessionForm?.id ?? 'new-session'}
          session={sessionForm}
          onClose={() => setSessionForm(null)}
          onSubmit={handleSaveSession}
          isSaving={isSavingSession}
        />
      )}

      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white">
              <Home size={18} />
            </Link>
            {isEditingTitle ? (
              <input
                autoFocus
                value={eventTitle}
                onChange={(event) => setEventTitle(event.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setIsEditingTitle(false)
                }}
                className="min-w-0 rounded-lg border border-sky-500 bg-zinc-900 px-3 py-2 text-lg font-black outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="min-w-0 truncate text-left text-lg font-black text-white"
              >
                {eventTitle}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ConnectionStatus state={connectionState} />
            <Link
              href="/display"
              className="hidden items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800 sm:inline-flex"
            >
              <Monitor size={16} />
              Display
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <section className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">Operator console</p>
                <h1 className="mt-1 text-2xl font-black">Preview & Program</h1>
              </div>
              <button
                type="button"
                disabled={!previewChanged || isSending}
                onClick={handleTake}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-rose-600 px-5 text-sm font-black text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                <Send size={17} />
                TAKE
              </button>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              <MiniDisplay state={draftState} tick={previewTick} mode="preview" />
              <MiniDisplay state={timerState} tick={programTick} mode="program" />
            </div>
          </section>

          <section className="grid gap-4 rounded-xl border border-white/10 bg-zinc-950/80 p-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                  <Settings2 size={15} />
                  Session loaded in preview
                </div>
                <input
                  value={draftState.sessionTitle}
                  onChange={(event) => updateDraft({ sessionTitle: event.target.value })}
                  placeholder="Session title"
                  className="mb-2 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition placeholder:text-zinc-600 focus:border-sky-500"
                />
                <input
                  value={draftState.sessionSpeaker}
                  onChange={(event) => updateDraft({ sessionSpeaker: event.target.value })}
                  placeholder="Speaker"
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition placeholder:text-zinc-600 focus:border-sky-500"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-300">Duration</p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="space-y-1">
                    <button type="button" onClick={() => changeDuration('minutes', durationParts.minutes + 1)} className="flex w-full justify-center rounded bg-zinc-900 py-1 text-zinc-400 hover:text-white">
                      <ChevronUp size={18} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={durationParts.minutes}
                      onChange={(event) => changeDuration('minutes', Number(event.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-zinc-900 py-3 text-center text-3xl font-black outline-none focus:border-sky-500"
                    />
                    <button type="button" onClick={() => changeDuration('minutes', Math.max(0, durationParts.minutes - 1))} className="flex w-full justify-center rounded bg-zinc-900 py-1 text-zinc-400 hover:text-white">
                      <ChevronDown size={18} />
                    </button>
                    <p className="text-center text-xs text-zinc-500">Minutes</p>
                  </div>
                  <span className="text-4xl font-black text-zinc-600">:</span>
                  <div className="space-y-1">
                    <button type="button" onClick={() => changeDuration('seconds', clamp(durationParts.seconds + 1, 0, 59))} className="flex w-full justify-center rounded bg-zinc-900 py-1 text-zinc-400 hover:text-white">
                      <ChevronUp size={18} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={durationParts.seconds}
                      onChange={(event) => changeDuration('seconds', Number(event.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-zinc-900 py-3 text-center text-3xl font-black outline-none focus:border-sky-500"
                    />
                    <button type="button" onClick={() => changeDuration('seconds', clamp(durationParts.seconds - 1, 0, 59))} className="flex w-full justify-center rounded bg-zinc-900 py-1 text-zinc-400 hover:text-white">
                      <ChevronDown size={18} />
                    </button>
                    <p className="text-center text-xs text-zinc-500">Seconds</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-500">Preview duration: {formatDuration(draftState.duration)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-300">Display theme</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(DISPLAY_THEMES).map(([themeKey, theme]) => (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => updateDraft({ theme: themeKey })}
                      className={`rounded-lg border px-3 py-2 text-left text-sm font-bold transition ${
                        draftState.theme === themeKey
                          ? 'border-sky-400 bg-sky-500/15 text-sky-200'
                          : 'border-white/10 bg-zinc-900 text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              <RunningTextInput
                value={draftState.runningText}
                onChange={(runningText) => updateDraft({ runningText })}
              />

              <TimerControls
                status={timerState.status}
                isSending={isSending}
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onReset={handleReset}
              />
            </div>
          </section>
        </div>

        <AgendaPanel
          sessions={sessions}
          activeSessionId={timerState.sessionId}
          onAdd={() => setSessionForm({})}
          onEdit={setSessionForm}
          onDelete={handleDeleteSession}
          onLoad={handleLoadSession}
          onReorder={handleReorderSessions}
        />
      </div>
    </main>
  )
}
