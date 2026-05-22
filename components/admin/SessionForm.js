'use client'

import { X } from 'lucide-react'
import { SESSION_COLORS, partsToSeconds, secondsToParts } from '@/lib/timer'
import { useState } from 'react'

const EMPTY_SESSION = {
  title: '',
  speaker: '',
  duration: 600,
  color: 'blue',
  notes: '',
}

export default function SessionForm({ session, onClose, onSubmit, isSaving }) {
  const initialForm = { ...EMPTY_SESSION, ...(session ?? {}) }
  const initialParts = secondsToParts(initialForm.duration)
  const [form, setForm] = useState(() => initialForm)
  const [minutes, setMinutes] = useState(() => String(initialParts.minutes))
  const [seconds, setSeconds] = useState(() => String(initialParts.seconds))
  const duration = partsToSeconds(Number(minutes) || 0, Math.min(Number(seconds) || 0, 59))

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const setDurationValue = (nextDuration) => {
    const next = secondsToParts(nextDuration)
    setMinutes(String(next.minutes))
    setSeconds(String(next.seconds))
  }
  const adjustDuration = (deltaSeconds) => {
    setDurationValue(Math.max(0, duration + deltaSeconds))
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 backdrop-blur sm:items-center">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({ ...form, duration })
        }}
        className="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-950 p-5 text-white shadow-2xl shadow-black/40"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
              {session?.id ? 'Edit Session' : 'New Session'}
            </p>
            <h2 className="mt-1 text-xl font-black">Agenda item</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white"
            aria-label="Close form"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-zinc-300">Title</span>
            <input
              required
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-zinc-300">Speaker</span>
            <input
              value={form.speaker}
              onChange={(event) => update('speaker', event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="block text-sm font-semibold text-zinc-300">Duration</span>
              <span className="rounded bg-white/5 px-2 py-1 text-xs font-bold text-zinc-400">
                {Math.floor(duration / 60)}m {duration % 60}s
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-500">Minutes</span>
                <div className="flex overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => adjustDuration(-60)}
                    className="w-10 border-r border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={minutes}
                    onChange={(event) => setMinutes(event.target.value)}
                    onBlur={() => setMinutes(String(Math.max(0, Number(minutes) || 0)))}
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-center text-2xl font-black outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustDuration(60)}
                    className="w-10 border-l border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  >
                    +
                  </button>
                </div>
              </label>

              <span className="pb-3 text-2xl font-black text-zinc-600">:</span>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-500">Seconds</span>
                <div className="flex overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => adjustDuration(-1)}
                    className="w-10 border-r border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    inputMode="numeric"
                    value={seconds}
                    onChange={(event) => setSeconds(event.target.value)}
                    onBlur={() => setSeconds(String(Math.min(Math.max(Number(seconds) || 0, 0), 59)))}
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-center text-2xl font-black outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustDuration(1)}
                    className="w-10 border-l border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  >
                    +
                  </button>
                </div>
              </label>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[5, 10, 15, 30].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDurationValue(preset * 60)}
                  className="rounded-md bg-zinc-900 px-2 py-1.5 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                >
                  {preset}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-semibold text-zinc-300">Color</span>
            <div className="flex flex-wrap gap-2">
              {Object.keys(SESSION_COLORS).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => update('color', color)}
                  className={`h-8 w-8 rounded-full ${SESSION_COLORS[color]} ${
                    form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : ''
                  }`}
                  aria-label={`Set ${color} color`}
                />
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-zinc-300">Notes</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => update('notes', event.target.value)}
              className="w-full resize-none rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-200 transition hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
