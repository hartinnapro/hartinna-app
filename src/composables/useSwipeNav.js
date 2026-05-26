import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export const slideDirection = ref('')

// Only these pages participate in swipe navigation
const SWIPE_TABS = ['/home', '/cart', '/orders', '/profile']
const TAB_INDEX  = Object.fromEntries(SWIPE_TABS.map((t, i) => [t, i]))

// Gesture thresholds — mid-screen swipe, no edge restriction
const MIN_DX     = 60    // minimum horizontal travel (px)
const MAX_DT     = 350   // maximum gesture duration (ms) — not a slow drag
const H_RATIO    = 1.8   // |dx| must exceed |dy| × this — clearly horizontal

// Lock prevents queuing a new navigation before current transition finishes
let locked = false

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
    if (locked) return
    if (e.changedTouches.length !== 1) return

    // Only active on the 4 main tab pages
    const idx = TAB_INDEX[route.path]
    if (idx === undefined) return

    const dx = e.changedTouches[0].clientX - startX
    const dy = e.changedTouches[0].clientY - startY
    const dt = Date.now() - startTime

    if (Math.abs(dx) < MIN_DX)               return  // too short
    if (Math.abs(dx) < Math.abs(dy) * H_RATIO) return  // too diagonal
    if (dt > MAX_DT)                         return  // too slow

    const goBack    = dx > 0  // swiped right → previous tab
    const goForward = dx < 0  // swiped left  → next tab

    locked = true

    if (goBack) {
      slideDirection.value = 'slide-right'
      router.push(SWIPE_TABS[(idx - 1 + SWIPE_TABS.length) % SWIPE_TABS.length])
    } else {
      slideDirection.value = 'slide-left'
      router.push(SWIPE_TABS[(idx + 1) % SWIPE_TABS.length])
    }
  }

  // Called by App.vue after the enter transition completes
  function unlock() {
    locked = false
    slideDirection.value = ''
  }

  return { onTouchStart, onTouchEnd, unlock }
}
