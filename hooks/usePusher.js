'use client'

import { useEffect, useState } from 'react'
import Pusher from 'pusher-js'

export function usePusherControl(onControl) {
  const [connectionState, setConnectionState] = useState(() =>
    process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER
      ? 'connecting'
      : 'offline'
  )

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      return undefined
    }

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    })

    const setState = (state) => setConnectionState(state)

    pusher.connection.bind('state_change', ({ current }) => setState(current))
    pusher.connection.bind('connected', () => setState('connected'))
    pusher.connection.bind('connecting', () => setState('connecting'))
    pusher.connection.bind('disconnected', () => setState('disconnected'))
    pusher.connection.bind('unavailable', () => setState('reconnecting'))
    pusher.connection.bind('error', () => setState('error'))

    const channel = pusher.subscribe('seminar-timer')
    channel.bind('control', onControl)

    return () => {
      channel.unbind('control', onControl)
      pusher.disconnect()
    }
  }, [onControl])

  return connectionState
}
