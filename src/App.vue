<script setup>
import { onMounted, onUnmounted, computed, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useWakeLock } from '@/composables/useWakeLock'
import { useSwipeNav, slideDirection } from '@/composables/useSwipeNav'
import { usePullToRefresh, ptrOffset, ptrReady, ptrReleasing } from '@/composables/usePullToRefresh'
import { useCartStore } from '@/stores/cart'
import { supabase } from '@/lib/supabase'
import AppNav from '@/components/AppNav.vue'

useWakeLock()
usePullToRefresh()  // registers its own document listeners for iOS PWA

const route = useRoute()
const cart  = useCartStore()
const { onTouchStart, onTouchMove, onTouchEnd, unlock } = useSwipeNav()

cart.load()

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

  // Non-passive touchmove for horizontal axis-lock (prevents iOS vertical jitter on swipes)
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

const showNav     = computed(() => NAV_PATHS.some(p => route.path === p))
const swipeActive = computed(() => SWIPE_PATHS.includes(route.path))

watch(showNav, show => {
  document.documentElement.classList.toggle('has-bottom-nav', show)
}, { immediate: true })

function onAfterEnter() { unlock() }
</script>

<template>
  <div
    ref="swipeRoot"
    class="swipe-root"
    @touchstart.passive="swipeActive ? onTouchStart($event) : undefined"
    @touchend.passive="swipeActive ? onTouchEnd($event) : undefined"
  >
    <!-- Pull-to-refresh indicator (iOS PWA only — usePullToRefresh activates it) -->
    <div
      class="ptr-wrap"
      :class="{ releasing: ptrReleasing }"
      :style="{ transform: `translateY(calc(-52px + ${ptrOffset}px))` }"
    >
      <div class="ptr-pill" :class="{ ready: ptrReady }">
        <svg class="ptr-icon" :class="{ spinning: ptrReady }"
          width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5">
          <path v-if="!ptrReady" d="M12 5v14M5 12l7 7 7-7"/>
          <path v-else d="M4 4v5h5M20 20v-5h-5M4.93 14A8 8 0 1 0 6.71 6.71L4 9"/>
        </svg>
        <span class="ptr-label">{{ ptrReady ? 'Release to refresh' : 'Pull to refresh' }}</span>
      </div>
    </div>

    <RouterView v-slot="{ Component, route }">
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
/* ── Pull-to-refresh indicator ──────────────────────────────────────────── */
.ptr-wrap {
  position: fixed;
  top: 0; left: 0; right: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 200;
}
.ptr-wrap.releasing {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.ptr-pill {
  display: flex; align-items: center; gap: 6px;
  background: #fff;
  border: 1px solid rgba(212,39,108,0.22);
  border-radius: 20px;
  padding: 7px 14px 7px 10px;
  box-shadow: 0 2px 12px rgba(212,39,108,0.14);
  transition: background 0.2s, border-color 0.2s;
}
.ptr-pill.ready { background: var(--primary); border-color: var(--primary); }
.ptr-icon { color: var(--primary); flex-shrink: 0; transition: color 0.2s; }
.ptr-icon.spinning { color: #fff; animation: ptr-spin 0.75s linear infinite; }
.ptr-label {
  font-size: 12px; font-weight: 600;
  color: var(--primary); white-space: nowrap;
  transition: color 0.2s;
}
.ptr-pill.ready .ptr-label { color: #fff; }
@keyframes ptr-spin { to { transform: rotate(360deg); } }

/* ── Swipe root ─────────────────────────────────────────────────────────── */
.swipe-root {
  position: relative;
  min-height: 100dvh;
  background: var(--bg);
}

/* ── Default transition: fade ───────────────────────────────────────────── */
.page-leave-active { transition: opacity 0.14s ease-in; }
.page-enter-active { transition: opacity 0.18s ease-out; }
.page-enter-from   { opacity: 0; }
.page-leave-to     { opacity: 0; }

/* ── Slide LEFT ─────────────────────────────────────────────────────────── */
.slide-left-leave-active {
  transition: transform 0.15s ease-in, opacity 0.15s ease-in;
}
.slide-left-leave-to   { transform: translateX(-20%); opacity: 0; }
.slide-left-enter-active {
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slide-left-enter-from { transform: translateX(100%); }
.slide-left-enter-to   { transform: translateX(0); }

/* ── Slide RIGHT ────────────────────────────────────────────────────────── */
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
