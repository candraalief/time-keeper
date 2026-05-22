'use client'

import { GripVertical, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { SESSION_COLORS, formatDuration } from '@/lib/timer'

export default function AgendaPanel({
  sessions,
  activeSessionId,
  onAdd,
  onEdit,
  onDelete,
  onLoad,
  onReorder,
}) {
  const moveSession = (fromId, toId) => {
    if (!fromId || fromId === toId) return

    const fromIndex = sessions.findIndex((session) => session.id === fromId)
    const toIndex = sessions.findIndex((session) => session.id === toId)
    if (fromIndex < 0 || toIndex < 0) return

    const next = [...sessions]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    onReorder(next.map((session, index) => ({ ...session, orderIndex: index })))
  }

  return (
    <section className="rounded-xl border border-white/10 bg-zinc-950/80">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">Agenda</p>
          <h2 className="mt-1 text-lg font-black text-white">Seminar sessions</h2>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-sky-500"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="max-h-[calc(100vh-210px)] space-y-2 overflow-y-auto p-3">
        {sessions.length === 0 && (
          <div className="rounded-lg border border-dashed border-white/10 p-6 text-center">
            <p className="text-sm font-semibold text-zinc-300">No sessions yet</p>
            <p className="mt-1 text-xs text-zinc-500">Add opening, keynote, breaks, and closing items.</p>
          </div>
        )}

        {sessions.map((session) => {
          const active = session.id === activeSessionId
          return (
            <article
              key={session.id}
              draggable
              onDragStart={(event) => event.dataTransfer.setData('text/plain', session.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => moveSession(event.dataTransfer.getData('text/plain'), session.id)}
              className={`group rounded-lg border p-3 transition ${
                active
                  ? 'border-emerald-400/50 bg-emerald-500/10'
                  : 'border-white/10 bg-zinc-900/70 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <GripVertical size={18} className="mt-1 shrink-0 cursor-grab text-zinc-600 group-hover:text-zinc-400" />
                <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${SESSION_COLORS[session.color] ?? SESSION_COLORS.blue}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-white">{session.title}</h3>
                      <p className="truncate text-xs text-zinc-400">{session.speaker || 'No speaker'}</p>
                    </div>
                    <span className="shrink-0 rounded bg-white/5 px-2 py-1 text-xs font-bold text-zinc-300">
                      {formatDuration(session.duration)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onLoad(session)}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500"
                    >
                      <Upload size={13} />
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(session)}
                      className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-200 transition hover:bg-zinc-700"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(session)}
                      className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2.5 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                    {active && <span className="rounded-md bg-emerald-500/15 px-2.5 py-1.5 text-xs font-black text-emerald-300">ACTIVE</span>}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
