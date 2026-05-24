<script setup>
import { useWakeLock } from '@/composables/useWakeLock'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppNav from '@/components/AppNav.vue'

useWakeLock()

const route = useRoute()

// Pages that show the bottom navigation. Listed centrally so AppNav can be
// rendered ONCE in App.vue (persistent across navigation) instead of inside
// each view — prevents nav flicker/jump during page transitions.
const NAV_PATHS = ['/home', '/cart', '/orders', '/profile']
const showNav = computed(() =>
  NAV_PATHS.some(p => route.path === p || route.path.startsWith(p + '/'))
)

// Mirror showNav onto an html class so variables.css can draw the bottom
// gradient full window width (Windows PWA fix). See variables.css for
// `.has-bottom-nav` rules.
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
