'use client'

import { Wifi, WifiOff } from 'lucide-react'

const ONLINE_STATES = new Set(['connected'])

export default function ConnectionStatus({ state = 'connecting', compact = false }) {
  const online = ONLINE_STATES.has(state)
  const label = online ? 'Connected' : state === 'offline' ? 'Offline' : 'Reconnecting'

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold ${
        online
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
      }`}
    >
      {online ? <Wifi size={compact ? 13 : 14} /> : <WifiOff size={compact ? 13 : 14} />}
      {!compact && <span>{label}</span>}
    </div>
  )
}
