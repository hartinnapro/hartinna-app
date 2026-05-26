import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export const slideDirection = ref('')

const TABS      = ['/home', '/cart', '/orders', '/profile']
const TAB_INDEX = Object.fromEntries(TABS.map((t, i) => [t, i]))

const IS_ANDROID = /android/i.test(navigator.userAgent)

// 400ms cooldown covers the full animation (150ms leave + 250ms enter)
const NAV_COOLDOWN = 400
let   lastNavAt    = 0

export function useSwipeNav() {
  const router = useRouter()
  const route  = useRoute()

  // Android: system OS gesture intercepts edge swipes before WebView sees them.
  // touch-action:pan-y does NOT stop OS-level gestures. Disabling on Android
  // entirely avoids the conflict — the tab bar handles navigation there.
  if (IS_ANDROID) {
    return { onTouchStart: () => {}, onTouchEnd: () => {} }
  }

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
    if (now - lastNavAt < NAV_COOLDOWN) return

    const dx = e.changedTouches[0].clientX - startX
    const dy = e.changedTouches[0].clientY - startY
    const dt = now - startTime

    // Require strong horizontal swipe starting away from edges.
    // Edge-zone swipes conflict with iOS WKWebView's own back gesture —
    // both iOS and our code would navigate, corrupting the route stack.
    const W = window.innerWidth
    if (startX < 30 || startX > W - 30)      return  // stay clear of iOS edge
    if (Math.abs(dx) < 80)                   return  // strong swipe needed
    if (Math.abs(dx) < Math.abs(dy) * 2.0)  return  // clearly horizontal
    if (dt > 400)                            return

    const goBack    = dx > 0
    const goForward = dx < 0
    const path      = route.path
    const idx       = TAB_INDEX[path]

    // PaymentView: swipe right → back to Cart
    if (path === '/payment' && goBack) {
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
