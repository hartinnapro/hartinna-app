// src/composables/useSwipeNav.js
// Horizontal swipe gesture → tab switching or back navigation.
// slideDirection is a module-level singleton so App.vue can read it
// without prop drilling.
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export const slideDirection = ref('')

const TABS      = ['/home', '/cart', '/orders', '/profile']
const TAB_INDEX = Object.fromEntries(TABS.map((t, i) => [t, i]))

// Edge zone (px from screen edge) that triggers the gesture.
// Keeps us clear of in-page interactive elements.
const EDGE_PX    = 45
const MIN_DX     = 55   // minimum horizontal travel
const MAX_DT     = 450  // ms — ignore slow drags
const RATIO      = 1.5  // |dx| must exceed |dy| × RATIO (mostly horizontal)

export function useSwipeNav() {
  const router = useRouter()
  const route  = useRoute()

  let startX = 0, startY = 0, startTime = 0

  function onTouchStart(e) {
    if (e.touches.length !== 1) return
    startX    = e.touches[0].clientX
    startY    = e.touches[0].clientY
    startTime = Date.now()
  }

  function onTouchEnd(e) {
    if (e.changedTouches.length !== 1) return

    const dx = e.changedTouches[0].clientX - startX
    const dy = e.changedTouches[0].clientY - startY
    const dt = Date.now() - startTime
    const W  = window.innerWidth

    if (Math.abs(dx) < MIN_DX)               return  // too short
    if (Math.abs(dx) < Math.abs(dy) * RATIO) return  // too vertical
    if (dt > MAX_DT)                         return  // too slow

    const goBack    = dx > 0  // finger moved right → back / previous tab
    const goForward = dx < 0  // finger moved left  → forward / next tab

    // Must start near the screen edge
    if (goBack    && startX > EDGE_PX)          return
    if (goForward && startX < W - EDGE_PX)      return

    const path = route.path
    const idx  = TAB_INDEX[path]

    // PaymentView → back to Cart
    if (path === '/payment' && goBack) {
      slideDirection.value = 'slide-right'
      router.push('/cart')
      return
    }

    // Tab-to-tab
    if (idx === undefined) return

    if (goBack && idx > 0) {
      slideDirection.value = 'slide-right'
      router.push(TABS[idx - 1])
    } else if (goForward && idx < TABS.length - 1) {
      slideDirection.value = 'slide-left'
      router.push(TABS[idx + 1])
    }
  }

  return { onTouchStart, onTouchEnd }
}
