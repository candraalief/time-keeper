'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { applyControlToState, normalizeTimerState } from '@/lib/timer'

export function useTimerState({ loadOnMount = true, onError } = {}) {
  const [timerState, setTimerState] = useState(() => normalizeTimerState())
  const [isLoading, setIsLoading] = useState(loadOnMount)
  const [isSending, setIsSending] = useState(false)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const applyControl = useCallback((payload) => {
    setTimerState((current) => applyControlToState(current, payload))
  }, [])

  const loadState = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/state', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load timer state')
      }

      setTimerState(normalizeTimerState(result.state))
      return result.state
    } catch (error) {
      onErrorRef.current?.(error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const sendControl = useCallback(async (payload) => {
    setIsSending(true)
    try {
      const response = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Control request failed')
      }

      if (result.state) {
        setTimerState(normalizeTimerState(result.state))
      } else {
        applyControl(result.payload ?? payload)
      }

      return result
    } catch (error) {
      onErrorRef.current?.(error)
      throw error
    } finally {
      setIsSending(false)
    }
  }, [applyControl])

  useEffect(() => {
    if (!loadOnMount) return undefined
    const timer = window.setTimeout(() => loadState(), 0)
    return () => window.clearTimeout(timer)
  }, [loadOnMount, loadState])

  return {
    timerState,
    setTimerState,
    applyControl,
    loadState,
    sendControl,
    isLoading,
    isSending,
  }
}
