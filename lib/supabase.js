import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey)

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: async (url, options = {}) => {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 8000)

          try {
            return await fetch(url, {
              ...options,
              signal: options.signal ?? controller.signal,
            })
          } finally {
            clearTimeout(timeout)
          }
        },
      },
    })
  : null

export function withSupabaseTimeout(request, label = 'Supabase request', ms = 8000) {
  return Promise.race([
    request,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    }),
  ])
}
