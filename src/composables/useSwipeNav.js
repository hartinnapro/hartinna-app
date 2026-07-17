import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export const slideDirection = ref('')

const SWIPE_TABS = ['/home', '/cart', '/orders', '/profile']
const TAB_INDEX  = Object.fromEntries(SWIPE_TABS.map((t, i) => [t, i]))

const MIN_DX  = 60
const MAX_DT  = 350
const H_RATIO = 1.8

let locked = false

export function useSwipeNav() {
  const router = useRouter()
  const route  = useRoute()

  let startX = 0, startY = 0, startTime = 0
  let axisLocked   = false
  let isHorizontal = false

  function onTouchStart(e) {
    if (e.touches.length !== 1) return
    startX       = e.touches[0].clientX
    startY       = e.touches[0].clientY
    startTime    = Date.now()
    axisLocked   = false
    isHorizontal = false
  }

  // Non-passive: allows preventDefault() to stop iOS vertical jitter during swipes
  function onTouchMove(e) {
    if (e.touches.length !== 1) return

    const dx = Math.abs(e.touches[0].clientX - startX)
    const dy = Math.abs(e.touches[0].clientY - startY)

    if (axisLocked) {
      if (isHorizontal) e.preventDefault()
      return
    }

    if (dx < 6 && dy < 6) return

    axisLocked   = true
    isHorizontal = dx > dy * 1.2

    if (isHorizontal) e.preventDefault()
  }

  function onTouchEnd(e) {
    if (locked || !isHorizontal) return
    if (e.changedTouches.length !== 1) return

    const idx = TAB_INDEX[route.path]
    if (idx === undefined) return

    const dx = e.changedTouches[0].clientX - startX
    const dy = e.changedTouches[0].clientY - startY
    const dt = Date.now() - startTime

    if (Math.abs(dx) < MIN_DX)                return
    if (Math.abs(dx) < Math.abs(dy) * H_RATIO) return
    if (dt > MAX_DT)                           return

    // Bounded at edges: no wrap-around. Home can't swipe to Profile, and vice versa.
    const target = dx > 0 ? idx - 1 : idx + 1
    if (target < 0 || target >= SWIPE_TABS.length) return

    locked = true
    slideDirection.value = dx > 0 ? 'slide-right' : 'slide-left'
    router.push(SWIPE_TABS[target])
  }

  function unlock() {
    locked = false
    slideDirection.value = ''
  }

  return { onTouchStart, onTouchMove, onTouchEnd, unlock }
}
