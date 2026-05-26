import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export const slideDirection = ref('')

const TABS      = ['/home', '/cart', '/orders', '/profile']
const TAB_INDEX = Object.fromEntries(TABS.map((t, i) => [t, i]))

const IS_ANDROID = /android/i.test(navigator.userAgent)

// Cooldown prevents new navigation while transition is still running.
// mode="out-in" leave takes ~150ms — 160ms lock covers it with margin.
const NAV_COOLDOWN = 160
let   lastNavAt    = 0

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

    const now = Date.now()
    if (now - lastNavAt < NAV_COOLDOWN) return  // still in transition

    const dx = e.changedTouches[0].clientX - startX
    const dy = e.changedTouches[0].clientY - startY
    const dt = now - startTime
    const W  = window.innerWidth

    const goBack    = dx > 0
    const goForward = dx < 0

    if (IS_ANDROID) {
      // Android system gesture owns the edges (~20px).
      // Detect from the middle zone only; needs a strong, clean horizontal swipe.
      if (startX < 60 || startX > W - 60)       return
      if (Math.abs(dx) < 80)                     return
      if (Math.abs(dx) < Math.abs(dy) * 2.0)    return
      if (dt > 450)                              return
    } else {
      // iOS: restrict to screen edge to avoid clashing with in-page interactions
      if (Math.abs(dx) < 55)                     return
      if (Math.abs(dx) < Math.abs(dy) * 1.5)    return
      if (dt > 450)                              return
      if (goBack    && startX > 45)              return
      if (goForward && startX < W - 45)          return
    }

    const path = route.path
    const idx  = TAB_INDEX[path]

    // PaymentView: only swipe-back on iOS (Android system back handles this)
    if (path === '/payment' && goBack && !IS_ANDROID) {
      lastNavAt = now
      slideDirection.value = 'slide-right'
      router.push('/cart')
      return
    }

    if (idx === undefined) return

    lastNavAt = now
    if (goBack) {
      slideDirection.value = 'slide-right'
      router.push(TABS[(idx - 1 + TABS.length) % TABS.length])
    } else {
      slideDirection.value = 'slide-left'
      router.push(TABS[(idx + 1) % TABS.length])
    }
  }

  return { onTouchStart, onTouchEnd }
}
