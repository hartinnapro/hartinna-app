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

// Clear slide direction once the entering page has settled
function onAfterEnter() {
  slideDirection.value = ''
}
</script>

<template>
  <!--
    .swipe-root: position:relative + overflow:hidden lets the slide
    transition run both pages side-by-side (position:absolute) without
    either leaking outside the viewport.
    AppNav is position:fixed so overflow:hidden doesn't clip it.
  -->
  <div
    class="swipe-root"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <RouterView v-slot="{ Component, route }">
      <Transition
        :name="slideDirection || 'page'"
        @after-enter="onAfterEnter"
      >
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
    <AppNav v-show="showNav" />
  </div>
</template>

<style>
/* ── Swipe wrapper ──────────────────────────────────────────────────────── */
.swipe-root {
  position: relative;
  overflow: hidden;
  min-height: 100dvh;
}

/* ── Default transition: fade only (no transform — iOS keyboard fix) ────── */
.page-leave-active { transition: opacity 0.14s ease-in; }
.page-enter-active { transition: opacity 0.18s ease-out; }
.page-enter-from   { opacity: 0; }
.page-leave-to     { opacity: 0; }

/* ── Slide LEFT: current exits left, next enters from right ─────────────── */
/* (user swiped left / tapped a tab to the right)                           */
.slide-left-leave-active,
.slide-left-enter-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  will-change: transform;
}
.slide-left-leave-to   { transform: translateX(-100%); }
.slide-left-enter-from { transform: translateX(100%);  }
.slide-left-leave-from,
.slide-left-enter-to   { transform: translateX(0);     }

/* ── Slide RIGHT: current exits right, next enters from left ────────────── */
/* (user swiped right / tapped a tab to the left)                           */
.slide-right-leave-active,
.slide-right-enter-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  will-change: transform;
}
.slide-right-leave-to   { transform: translateX(100%);  }
.slide-right-enter-from { transform: translateX(-100%); }
.slide-right-leave-from,
.slide-right-enter-to   { transform: translateX(0);     }
</style>
