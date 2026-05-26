import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useCartStore = defineStore('cart', () => {
  const items        = ref({})    // { [productId]: { product, qty } }
  const cartLoading  = ref(false) // true while initRemote is in flight
  const remoteSynced = ref(false) // true once the first remote load completed
  let uid = null

  // ── Computed ─────────────────────────────────────────────────────────────
  const cartCount  = computed(() =>
    Object.values(items.value).reduce((s, i) => s + i.qty, 0)
  )
  const cartList   = computed(() => Object.values(items.value))
  const grandTotal = computed(() =>
    cartList.value.reduce((s, i) =>
      s + (i.product.product_prices?.[0]?.price ?? 0) * i.qty, 0)
  )

  // ── Local ─────────────────────────────────────────────────────────────────
  function load() {
    try { items.value = JSON.parse(localStorage.getItem('hpp_cart') || '{}') }
    catch { items.value = {} }
  }
  function save() {
    try { localStorage.setItem('hpp_cart', JSON.stringify(items.value)) }
    catch {}
  }

  // ── Remote fire-and-forget ────────────────────────────────────────────────
  async function pushItem(productId, qty) {
    if (!uid) return
    try {
      if (qty <= 0) {
        await supabase.from('cart_items')
          .delete().eq('member_id', uid).eq('product_id', productId)
      } else {
        await supabase.from('cart_items').upsert(
          { member_id: uid, product_id: productId, qty,
            updated_at: new Date().toISOString() },
          { onConflict: 'member_id,product_id' }
        )
      }
    } catch (e) {
      console.warn('[cart] push failed:', e?.message)
    }
  }

  // ── Remote init ───────────────────────────────────────────────────────────
  // Called on INITIAL_SESSION, SIGNED_IN, and TOKEN_REFRESHED.
  // Guard: skips if already synced for the same user so the second
  // TOKEN_REFRESHED event (which fires after every auto-refresh) doesn't
  // re-fetch the whole catalogue unnecessarily.
  async function initRemote(userId) {
    if (remoteSynced.value && uid === userId) return

    uid = userId
    load()            // instant local render while remote loads
    cartLoading.value = true

    try {
      const { data: rows, error } = await supabase
        .from('cart_items')
        .select('product_id, qty')
        .eq('member_id', userId)

      if (error) throw error

      if (!rows?.length) {
        // No remote cart yet — push any local items up (offline additions)
        for (const [pid, item] of Object.entries(items.value)) {
          await pushItem(pid, item.qty)
        }
        remoteSynced.value = true
        return
      }

      const ids = rows.map(r => r.product_id)

      // RLS on product_prices automatically returns only this member's tier.
      const { data: products } = await supabase
        .from('products')
        .select('id, name, sku, image_url, product_prices(price, member_level)')
        .in('id', ids)
        .eq('is_active', true)

      if (!products) {
        remoteSynced.value = true
        return
      }

      const pMap = Object.fromEntries(products.map(p => [p.id, p]))

      // Remote is authoritative. Local-only items (added offline) are kept
      // and queued for upload.
      const localOnly = Object.entries(items.value)
        .filter(([pid]) => !ids.includes(pid))

      const merged = {}
      for (const row of rows) {
        const product = pMap[row.product_id]
        if (product) merged[row.product_id] = { product, qty: row.qty }
      }
      for (const [pid, item] of localOnly) {
        if (pMap[pid]) {
          merged[pid] = { product: pMap[pid], qty: item.qty }
          pushItem(pid, item.qty)
        }
      }

      items.value = merged
      save()
      remoteSynced.value = true
    } catch (e) {
      console.warn('[cart] initRemote failed — using local cart:', e?.message)
    } finally {
      cartLoading.value = false
    }
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  function setQty(product, qty) {
    if (qty <= 0) { remove(product.id); return }
    items.value = { ...items.value, [product.id]: { product, qty } }
    save(); pushItem(product.id, qty)
  }

  function addToCart(product, qty) {
    items.value = { ...items.value, [product.id]: { product, qty } }
    save(); pushItem(product.id, qty)
  }

  function remove(productId) {
    const next = { ...items.value }; delete next[productId]
    items.value = next
    save(); pushItem(productId, 0)
  }

  function clear() {
    items.value = {}
    localStorage.removeItem('hpp_cart')
    if (uid) {
      supabase.from('cart_items').delete().eq('member_id', uid)
        .catch(e => console.warn('[cart] clear failed:', e?.message))
    }
  }

  function signOut() {
    items.value = {}; localStorage.removeItem('hpp_cart')
    uid = null; remoteSynced.value = false
  }

  function updateQty(productId, qty) {
    if (!items.value[productId]) return
    if (qty <= 0) { remove(productId); return }
    items.value = { ...items.value, [productId]: { ...items.value[productId], qty } }
    save(); pushItem(productId, qty)
  }

  function getQty(productId) { return items.value[productId]?.qty ?? 0 }
  function inCart(productId) { return !!items.value[productId] }

  return {
    items, cartCount, cartList, grandTotal,
    cartLoading, remoteSynced,
    load, save,
    initRemote, signOut,
    setQty, addToCart, remove, clear,
    getQty, inCart, updateQty
  }
})
