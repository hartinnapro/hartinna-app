import { supabase } from '@/lib/supabase'

/**
 * Returns the current session, enforcing the 7-day "keep me signed in" window.
 * Returns null if not authenticated or if the keep-window has expired.
 */
export async function guardedSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const keepUntil = localStorage.getItem('hpp_keep_until')
  if (keepUntil) {
    if (Date.now() > parseInt(keepUntil)) {
      await supabase.auth.signOut()
      return null
    }
    // Roll the window on every visit
    localStorage.setItem('hpp_keep_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000))
  }

  return session
}
