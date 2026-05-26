// Standalone pull-to-refresh for iOS PWA.
// iOS PWA (standalone mode) disables the native browser PTR —
// this composable re-implements it with a custom indicator.
// Works on all pages, independent of useSwipeNav.

import { ref, onMounted, onUnmounted } from 'vue'

export const ptrOffset    = ref(0)     // px the indicator has traveled
export const ptrReady     = ref(false) // true when past release threshold
export const ptrReleasing = ref(false) // true during snap-back animation

const PTR_THRESHOLD = 70   // px before release triggers reload
const PTR_MAX       = 105  // px max visual travel
const PTR_DAMPING   = 0.45 // converts finger px → indicator px

// Both Safari PWA and Chrome PWA on iOS have navigator.standalone = true
const IS_IOS_PWA = typeof window !== 'undefined' && !!window.navigator.standalone

export function usePullToRefresh() {
  if (!IS_IOS_PWA) return  // browsers have native PTR; only needed for PWA

  let startY    = 0
  let isPulling = false

  function onTouchStart(e) {
    if (e.touches.length !== 1) return
    startY    = e.touches[0].clientY
    isPulling = false
  }

  function onTouchMove(e) {
    if (e.touches.length !== 1) return

    // Only activate at the very top of the page
    if (window.scrollY > 2) return

    const dy = e.touches[0].clientY - startY
    const dx = Math.abs(e.touches[0].clientX - startY) // horizontal drift check

    if (dy <= 0) return     // pulling up — let normal behaviour handle it

    // Must be mostly downward (not a diagonal that useSwipeNav handles)
    if (dx > dy * 0.6) return

    isPulling       = true
    ptrOffset.value = Math.min(dy * PTR_DAMPING, PTR_MAX)
    ptrReady.value  = ptrOffset.value >= PTR_THRESHOLD

    // Prevent page bounce / iOS rubber-band while we're showing the indicator
    e.preventDefault()
  }

  function onTouchEnd() {
    if (!isPulling) return
    isPulling = false

    if (ptrReady.value) {
      // Snap to hold position briefly, then reload
      ptrReleasing.value = true
      setTimeout(() => {
        ptrOffset.value    = 0
        ptrReady.value     = false
        ptrReleasing.value = false
        window.location.reload()
      }, 280)
    } else {
      // Snap back without reloading
      ptrReleasing.value = true
      ptrOffset.value    = 0
      ptrReady.value     = false
      setTimeout(() => { ptrReleasing.value = false }, 300)
    }
  }

  onMounted(() => {
    // Must be non-passive to call preventDefault() and stop iOS bounce
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove',  onTouchMove,  { passive: false })
    document.addEventListener('touchend',   onTouchEnd,   { passive: true })
  })

  onUnmounted(() => {
    document.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('touchmove',  onTouchMove)
    document.removeEventListener('touchend',   onTouchEnd)
  })
}
