'use client'

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

export default function ToastStack({ toasts = [], onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] ?? Info
        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 rounded-lg border border-white/10 bg-zinc-950/95 p-3 text-sm text-white shadow-xl shadow-black/30 backdrop-blur"
          >
            <Icon
              size={18}
              className={
                toast.type === 'success'
                  ? 'mt-0.5 text-emerald-400'
                  : toast.type === 'error'
                    ? 'mt-0.5 text-rose-400'
                    : 'mt-0.5 text-sky-400'
              }
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{toast.title}</p>
              {toast.message && <p className="mt-0.5 text-xs text-zinc-400">{toast.message}</p>}
            </div>
            <button
              type="button"
              onClick={() => onDismiss?.(toast.id)}
              className="rounded p-1 text-zinc-500 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
