import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useCartStore = defineStore('cart', () => {
  const items = ref({})   // { [productId]: { product, qty } }
  let uid = null           // set on auth; null = not logged in / offline

  // ── Computed ─────────────────────────────────────────────────────────────
  const cartCount  = computed(() =>
    Object.values(items.value).reduce((s, i) => s + i.qty, 0)
  )
  const cartList   = computed(() => Object.values(items.value))
  const grandTotal = computed(() =>
    cartList.value.reduce((s, i) =>
      s + (i.product.product_prices?.[0]?.price ?? 0) * i.qty, 0
    )
  )

  // ── Local persistence ─────────────────────────────────────────────────────
  function load() {
    try { items.value = JSON.parse(localStorage.getItem('hpp_cart') || '{}') }
    catch { items.value = {} }
  }

  function save() {
    try { localStorage.setItem('hpp_cart', JSON.stringify(items.value)) }
    catch {}
  }

  // ── Remote sync (fire-and-forget) ─────────────────────────────────────────
  // UI is never blocked waiting for the remote — local state updates
  // immediately, Supabase receives the write in the background.
  async function pushItem(productId, qty) {
    if (!uid) return
    try {
      if (qty <= 0) {
        await supabase.from('cart_items')
          .delete()
          .eq('member_id', uid)
          .eq('product_id', productId)
      } else {
        await supabase.from('cart_items').upsert(
          { member_id: uid, product_id: productId, qty,
            updated_at: new Date().toISOString() },
          { onConflict: 'member_id,product_id' }
        )
      }
    } catch (e) {
      console.warn('[cart] push failed — will retry on next interaction:', e?.message)
    }
  }

  // ── Remote init (called on auth state SIGNED_IN / INITIAL_SESSION) ────────
  async function initRemote(userId) {
    uid = userId
    load()  // show local cart instantly while remote loads

    try {
      const { data: rows, error } = await supabase
        .from('cart_items')
        .select('product_id, qty')
        .eq('member_id', userId)

      if (error) throw error

      if (!rows?.length) {
        // No remote cart — push any locally-stored items up
        // (handles the case where user added items while offline/unauthenticated)
        for (const [pid, item] of Object.entries(items.value)) {
          await pushItem(pid, item.qty)
        }
        return
      }

      // Fetch fresh product details for remote items.
      // RLS on product_prices automatically returns only the member's tier price.
      const ids = rows.map(r => r.product_id)
      const { data: products } = await supabase
        .from('products')
        .select('id, name, sku, image_url, product_prices(price, member_level)')
        .in('id', ids)
        .eq('is_active', true)

      if (!products) return

      const pMap = Object.fromEntries(products.map(p => [p.id, p]))

      // Remote is authoritative for products that exist in both.
      // Local-only items (added offline) are kept and queued for upload.
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
          pushItem(pid, item.qty)  // upload offline item
        }
      }

      items.value = merged
      save()
    } catch (e) {
      console.warn('[cart] initRemote failed — using local cart:', e?.message)
    }
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  function setQty(product, qty) {
    if (qty <= 0) { remove(product.id); return }
    items.value = { ...items.value, [product.id]: { product, qty } }
    save()
    pushItem(product.id, qty)
  }

  function addToCart(product, qty) {
    items.value = { ...items.value, [product.id]: { product, qty } }
    save()
    pushItem(product.id, qty)
  }

  function remove(productId) {
    const next = { ...items.value }
    delete next[productId]
    items.value = next
    save()
    pushItem(productId, 0)
  }

  function clear() {
    items.value = {}
    localStorage.removeItem('hpp_cart')
    if (uid) {
      supabase.from('cart_items').delete().eq('member_id', uid)
        .then(() => {}).catch(e => console.warn('[cart] clear failed:', e?.message))
    }
  }

  function signOut() {
    items.value = {}
    localStorage.removeItem('hpp_cart')
    uid = null
  }

  function getQty(productId)  { return items.value[productId]?.qty ?? 0 }
  function inCart(productId)  { return !!items.value[productId] }

  function updateQty(productId, qty) {
    if (!items.value[productId]) return
    if (qty <= 0) { remove(productId); return }
    items.value = { ...items.value, [productId]: { ...items.value[productId], qty } }
    save()
    pushItem(productId, qty)
  }

  return {
    items, cartCount, cartList, grandTotal,
    load, save,
    initRemote, signOut,
    setQty, addToCart, remove, clear,
    getQty, inCart, updateQty
  }
})
