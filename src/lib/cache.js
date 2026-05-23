/** Stale-while-revalidate cache backed by localStorage */

export function hppGetCache(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null')?.data ?? null }
  catch { return null }
}

export function hppSetCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) }
  catch {}
}

export function hppClearCache(uid) {
  ;['home', 'orders', 'profile'].forEach(p =>
    localStorage.removeItem(`hpp_${p}_${uid}`)
  )
}
