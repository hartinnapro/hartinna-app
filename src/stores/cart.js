import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { hppGetCache } from '@/lib/cache'

export const useCartStore = defineStore('cart', () => {
  const items        = ref({})
  const cartLoading  = ref(false)
  const remoteSynced = ref(false)
  let uid = null

  // ── Computed ─────────────────────────────────────────────────────────────
  const cartCount  = computed(() =>
    Object.values(items.value).reduce((s, i) => s + i.qty, 0)
  )
  // Always sorted newest-updated first — consistent between local edits
  // and remote loads (both use the same updated_at timestamp source).
  const cartList   = computed(() =>
    Object.values(items.value).sort((a, b) =>
      new Date(b.updated_at ?? 0) - new Date(a.updated_at ?? 0)
    )
  )
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

  // ── Remote push (fire-and-forget) ─────────────────────────────────────────
  // product is stored as a snapshot so other devices can restore the full
  // cart item without querying the products table at all.
  async function pushItem(productId, qty, product = null) {
    if (!uid) return
    try {
      if (qty <= 0) {
        await supabase.from('cart_items')
          .delete().eq('member_id', uid).eq('product_id', productId)
      } else {
        const row = {
          member_id:        uid,
          product_id:       productId,
          qty,
          updated_at:       new Date().toISOString(),
          product_snapshot: product ?? null
        }
        await supabase.from('cart_items')
          .upsert(row, { onConflict: 'member_id,product_id' })
      }
    } catch (e) {
      console.warn('[cart] push failed:', e?.message)
    }
  }

  // ── Remote init ───────────────────────────────────────────────────────────
  // Reads cart_items rows directly — no products table join needed.
  // product_snapshot carries the full product object written by the device
  // that originally added the item. Falls back to the local HomeView cache
  // for rows that were inserted before this change (no snapshot yet).
  async function initRemote(userId) {
    if (remoteSynced.value && uid === userId) return
    uid = userId
    load()
    cartLoading.value = true

    try {
      const { data: rows, error } = await supabase
        .from('cart_items')
        .select('product_id, qty, product_snapshot, updated_at')
        .eq('member_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (!rows?.length) {
        // Nothing remote yet — push local items up with their snapshots
        for (const [pid, item] of Object.entries(items.value)) {
          await pushItem(pid, item.qty, item.product)
        }
        remoteSynced.value = true
        return
      }

      // Build the cart from snapshots.
      // For legacy rows without a snapshot, try the HomeView product cache
      // (the user has almost certainly browsed the catalogue on this device).
      const homeCache = hppGetCache(`hpp_home_${userId}`)
      const cachedProducts = Object.fromEntries(
        (homeCache?.products ?? []).map(p => [p.id, p])
      )

      const merged = {}
      for (const row of rows) {
        const product = row.product_snapshot ?? cachedProducts[row.product_id]
        if (product) {
          merged[row.product_id] = { product, qty: row.qty, updated_at: row.updated_at }
          // Backfill the snapshot for rows that didn't have one
          if (!row.product_snapshot && product) {
            pushItem(row.product_id, row.qty, product)
          }
        }
      }

      // Merge in any local-only items (added offline)
      for (const [pid, item] of Object.entries(items.value)) {
        if (!merged[pid]) {
          merged[pid] = item
          pushItem(pid, item.qty, item.product)
        }
      }

      if (Object.keys(merged).length > 0) {
        items.value = merged
        save()
      }
      remoteSynced.value = true
    } catch (e) {
      console.warn('[cart] initRemote failed:', e?.message)
    } finally {
      cartLoading.value = false
    }
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  function setQty(product, qty) {
    if (qty <= 0) { remove(product.id); return }
    const updated_at = new Date().toISOString()
    items.value = { ...items.value, [product.id]: { product, qty, updated_at } }
    save(); pushItem(product.id, qty, product)
  }

  function addToCart(product, qty) {
    const updated_at = new Date().toISOString()
    items.value = { ...items.value, [product.id]: { product, qty, updated_at } }
    save(); pushItem(product.id, qty, product)
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
    items.value = {}
    localStorage.removeItem('hpp_cart')
    uid = null
    remoteSynced.value = false
  }

  function updateQty(productId, qty) {
    if (!items.value[productId]) return
    if (qty <= 0) { remove(productId); return }
    const product    = items.value[productId].product
    const updated_at = new Date().toISOString()
    items.value = { ...items.value, [productId]: { product, qty, updated_at } }
    save(); pushItem(productId, qty, product)
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
