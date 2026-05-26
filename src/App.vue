<script setup>
import { onMounted, onUnmounted, computed, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useWakeLock } from '@/composables/useWakeLock'
import { useSwipeNav, slideDirection } from '@/composables/useSwipeNav'
import { useCartStore } from '@/stores/cart'
import { supabase } from '@/lib/supabase'
import AppNav from '@/components/AppNav.vue'

useWakeLock()

const route = useRoute()
const cart  = useCartStore()
const { onTouchStart, onTouchMove, onTouchEnd, unlock } = useSwipeNav()

cart.load()

// touchmove must be non-passive so we can call preventDefault() to
// stop iOS from scrolling vertically during a horizontal swipe.
// Vue's @touchmove.passive cannot be overridden, so we use addEventListener.
const swipeRoot = ref(null)
onMounted(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') { cart.signOut(); return }
    if (route.path === '/login') return
    if (session && (
      event === 'INITIAL_SESSION' ||
      event === 'SIGNED_IN'       ||
      event === 'TOKEN_REFRESHED'
    )) {
      cart.initRemote(session.user.id)
    }
  })

  if (swipeRoot.value) {
    swipeRoot.value.addEventListener('touchmove', onTouchMove, { passive: false })
  }
})

onUnmounted(() => {
  if (swipeRoot.value) {
    swipeRoot.value.removeEventListener('touchmove', onTouchMove)
  }
})

const NAV_PATHS   = ['/home', '/cart', '/orders', '/profile', '/payment']
const SWIPE_PATHS = ['/home', '/cart', '/orders', '/profile']

const showNav      = computed(() => NAV_PATHS.some(p => route.path === p))
const swipeActive  = computed(() => SWIPE_PATHS.includes(route.path))

watch(showNav, show => {
  document.documentElement.classList.toggle('has-bottom-nav', show)
}, { immediate: true })
</script>

<template>
  <div
    ref="swipeRoot"
    class="swipe-root"
    @touchstart.passive="swipeActive ? onTouchStart($event) : undefined"
    @touchend.passive="swipeActive ? onTouchEnd($event) : undefined"
  >
    <RouterView v-slot="{ Component, route }">
      <Transition
        :name="slideDirection || 'page'"
        mode="out-in"
        @after-enter="unlock"
      >
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
    <AppNav v-show="showNav" />
  </div>
</template>

<style>
.swipe-root {
  position: relative;
  min-height: 100dvh;
  background: var(--bg);
}

/* ── Default: fade ──────────────────────────────────────────────────────── */
.page-leave-active { transition: opacity 0.14s ease-in; }
.page-enter-active { transition: opacity 0.18s ease-out; }
.page-enter-from   { opacity: 0; }
.page-leave-to     { opacity: 0; }

/* ── Slide LEFT: current fades out left, new slides in from right ───────── */
.slide-left-leave-active {
  transition: transform 0.15s ease-in, opacity 0.15s ease-in;
}
.slide-left-leave-to   { transform: translateX(-20%); opacity: 0; }
.slide-left-enter-active {
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slide-left-enter-from { transform: translateX(100%); }
.slide-left-enter-to   { transform: translateX(0); }

/* ── Slide RIGHT: current fades out right, new slides in from left ──────── */
.slide-right-leave-active {
  transition: transform 0.15s ease-in, opacity 0.15s ease-in;
}
.slide-right-leave-to   { transform: translateX(20%); opacity: 0; }
.slide-right-enter-active {
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slide-right-enter-from { transform: translateX(-100%); }
.slide-right-enter-to   { transform: translateX(0); }
</style>
