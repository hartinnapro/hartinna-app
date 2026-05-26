<script setup>
import { onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useWakeLock } from '@/composables/useWakeLock'
import { useSwipeNav, slideDirection } from '@/composables/useSwipeNav'
import { useCartStore } from '@/stores/cart'
import { supabase } from '@/lib/supabase'
import AppNav from '@/components/AppNav.vue'

useWakeLock()

const route = useRoute()
const cart  = useCartStore()
const { onTouchStart, onTouchEnd } = useSwipeNav()

cart.load()

onMounted(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      cart.signOut()
      return
    }
    if (route.path === '/login') return
    if (session && (
      event === 'INITIAL_SESSION' ||
      event === 'SIGNED_IN'       ||
      event === 'TOKEN_REFRESHED'
    )) {
      cart.initRemote(session.user.id)
    }
  })
})

const NAV_PATHS = ['/home', '/cart', '/orders', '/profile', '/payment']
const showNav = computed(() =>
  NAV_PATHS.some(p => route.path === p || route.path.startsWith(p + '/'))
)
watch(showNav, show => {
  document.documentElement.classList.toggle('has-bottom-nav', show)
}, { immediate: true })

function onAfterEnter() {
  slideDirection.value = ''
}
</script>

<template>
  <!--
    touch-action:pan-y  → tells Android Chrome we own horizontal swipes;
                          prevents the system back/forward gesture intercepting
    overscroll-behavior-x:none → stops iOS rubber-band on horizontal drags
  -->
  <div
    class="swipe-root"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <RouterView v-slot="{ Component, route }">
      <!--
        mode="out-in": leaving page animates out FIRST (150ms), then entering
        page slides in (250ms). No simultaneous position:absolute rendering,
        no gap/flash, and the 150ms leave phase acts as a natural swipe lock.
      -->
      <Transition
        :name="slideDirection || 'page'"
        mode="out-in"
        @after-enter="onAfterEnter"
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
  background: var(--bg);         /* covers the 1-frame gap in mode=out-in */
  touch-action: pan-y;
  overscroll-behavior-x: none;
}

/* ── Default transition: fade ───────────────────────────────────────────── */
.page-leave-active { transition: opacity 0.14s ease-in; }
.page-enter-active { transition: opacity 0.18s ease-out; }
.page-enter-from   { opacity: 0; }
.page-leave-to     { opacity: 0; }

/* ── Slide LEFT (swipe left → next tab enters from right) ───────────────── */
/* Current page: quick fade-slide left (150ms) */
.slide-left-leave-active {
  transition: transform 0.15s ease-in, opacity 0.15s ease-in;
}
.slide-left-leave-to { transform: translateX(-18%); opacity: 0; }
/* New page: slides in from right (250ms) */
.slide-left-enter-active {
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slide-left-enter-from { transform: translateX(100%); }
.slide-left-enter-to   { transform: translateX(0); }

/* ── Slide RIGHT (swipe right → prev tab enters from left) ──────────────── */
/* Current page: quick fade-slide right (150ms) */
.slide-right-leave-active {
  transition: transform 0.15s ease-in, opacity 0.15s ease-in;
}
.slide-right-leave-to { transform: translateX(18%); opacity: 0; }
/* New page: slides in from left (250ms) */
.slide-right-enter-active {
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slide-right-enter-from { transform: translateX(-100%); }
.slide-right-enter-to   { transform: translateX(0); }
</style>
