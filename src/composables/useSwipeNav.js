import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export const slideDirection = ref('')

const TABS      = ['/home', '/cart', '/orders', '/profile']
const TAB_INDEX = Object.fromEntries(TABS.map((t, i) => [t, i]))

// Detect once at module load — determines gesture zone strategy
const IS_ANDROID = /android/i.test(navigator.userAgent)

// iOS  : swipes must START near the screen edge (system gesture-safe)
// Android: system owns the edges (~20px); detect from centre zone instead
const IOS_EDGE_PX   = 45   // px from edge for iOS
const AND_SAFE_MIN  = 60   // px from left edge — Android safe start
const AND_MIN_DX    = 80   // stronger swipe needed on Android (no edge anchor)
const AND_RATIO     = 2.0  // stricter horizontal ratio for Android
const IOS_MIN_DX    = 55
const IOS_RATIO     = 1.5
const MAX_DT        = 450  // ms — ignore slow drags

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

    const goBack    = dx > 0  // finger moved right
    const goForward = dx < 0  // finger moved left

    if (IS_ANDROID) {
      // Stay out of Android's system gesture zones at both edges
      if (startX < AND_SAFE_MIN || startX > W - AND_SAFE_MIN) return
      if (Math.abs(dx) < AND_MIN_DX)               return
      if (Math.abs(dx) < Math.abs(dy) * AND_RATIO) return
      if (dt > MAX_DT)                              return
    } else {
      // iOS: restrict to screen edge so in-page interactions don't conflict
      if (Math.abs(dx) < IOS_MIN_DX)               return
      if (Math.abs(dx) < Math.abs(dy) * IOS_RATIO) return
      if (dt > MAX_DT)                              return
      if (goBack    && startX > IOS_EDGE_PX)        return
      if (goForward && startX < W - IOS_EDGE_PX)   return
    }

    const path = route.path
    const idx  = TAB_INDEX[path]

    // PaymentView → back to Cart
    // Android uses its own system back gesture so skip for Android
    if (path === '/payment' && goBack && !IS_ANDROID) {
      slideDirection.value = 'slide-right'
      router.push('/cart')
      return
    }

    if (idx === undefined) return

    if (goBack) {
      // Circular: Home wraps to Profile
      slideDirection.value = 'slide-right'
      router.push(TABS[(idx - 1 + TABS.length) % TABS.length])
    } else {
      // Circular: Profile wraps to Home
      slideDirection.value = 'slide-left'
      router.push(TABS[(idx + 1) % TABS.length])
    }
  }

  return { onTouchStart, onTouchEnd }
}
