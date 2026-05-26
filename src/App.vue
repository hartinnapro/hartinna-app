<script setup>
import { onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useWakeLock } from '@/composables/useWakeLock'
import { useCartStore } from '@/stores/cart'
import { supabase } from '@/lib/supabase'
import AppNav from '@/components/AppNav.vue'

useWakeLock()

const route = useRoute()
const cart  = useCartStore()

cart.load()

onMounted(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      cart.signOut()
      return
    }

    // Do NOT call initRemote while on the login page.
    // On iOS PWA (WKWebView standalone), Pinia reactive updates triggered
    // by auth events fire during keyboard animation and cancel input focus —
    // the keyboard never appears. The cart is synced from CartView instead.
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
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
  <AppNav v-show="showNav" />
</template>

<style>
.page-leave-active { transition: opacity 0.14s ease-in; }
.page-enter-active { transition: opacity 0.22s ease-out; }
.page-enter-from   { opacity: 0; }
.page-leave-to     { opacity: 0; }
</style>
