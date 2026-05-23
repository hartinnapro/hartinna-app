import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref({}) // { [productId]: { product, qty } }

  // ── Computed ────────────────────────────────────────────────────────────
  const cartCount = computed(() =>
    Object.values(items.value).reduce((sum, item) => sum + item.qty, 0)
  )

  const cartList = computed(() => Object.values(items.value))

  const grandTotal = computed(() =>
    cartList.value.reduce((sum, item) => {
      const price = item.product.product_prices?.[0]?.price ?? 0
      return sum + price * item.qty
    }, 0)
  )

  // ── Persistence ──────────────────────────────────────────────────────────
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem('hpp_cart') || '{}')
      items.value = saved
    } catch {
      items.value = {}
    }
  }

  function save() {
    try { localStorage.setItem('hpp_cart', JSON.stringify(items.value)) }
    catch {}
  }

  // ── Mutations ────────────────────────────────────────────────────────────
  function setQty(product, qty) {
    if (qty <= 0) {
      remove(product.id)
      return
    }
    items.value = { ...items.value, [product.id]: { product, qty } }
    save()
  }

  function addToCart(product, qty) {
    items.value = { ...items.value, [product.id]: { product, qty } }
    save()
  }

  function remove(productId) {
    const next = { ...items.value }
    delete next[productId]
    items.value = next
    save()
  }

  function clear() {
    items.value = {}
    localStorage.removeItem('hpp_cart')
  }

  function getQty(productId) {
    return items.value[productId]?.qty ?? 0
  }

  function inCart(productId) {
    return !!items.value[productId]
  }

  // Update qty of existing cart item (used in CartView stepper)
  function updateQty(productId, qty) {
    if (!items.value[productId]) return
    if (qty <= 0) { remove(productId); return }
    items.value = {
      ...items.value,
      [productId]: { ...items.value[productId], qty }
    }
    save()
  }

  return {
    items, cartCount, cartList, grandTotal,
    load, save,
    setQty, addToCart, remove, clear,
    getQty, inCart, updateQty
  }
})
