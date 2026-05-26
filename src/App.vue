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

// Load local cart immediately on app boot so the badge count
// is visible before auth resolves.
cart.load()

// Sync cart with Supabase whenever auth state is known.
// INITIAL_SESSION fires on first load; SIGNED_IN fires after login.
onMounted(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session) {
      cart.initRemote(session.user.id)
    } else if (event === 'SIGNED_OUT') {
      cart.signOut()
    }
  })
})

const NAV_PATHS = ['/home', '/cart', '/orders', '/profile', '/payment']
const showNav = computed(() =>
  NAV_PATHS.some(p => route.path === p || route.path.startsWith(p + '/'))
)

watch(showNav, (show) => {
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
.page-leave-active {
  transition: opacity 0.14s ease-in;
}
.page-enter-active {
  transition: opacity 0.22s ease-out, transform 0.22s ease-out;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
}
</style>
