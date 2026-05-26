<template>
  <nav class="sqnav" aria-label="Main navigation">
    <div
      v-for="(item, i) in items"
      :key="item.route"
      :class="['sqn-item', isActive(item) ? 'active' : 'idle']"
      role="button"
      :aria-label="item.label"
      @click="navigate(item)"
    >
      <div class="sqn-squircle">
        <component :is="item.icon" />
        <span class="sqn-label">{{ item.label }}</span>
        <!-- Cart badge -->
        <span v-if="item.route === '/cart' && cartCount > 0" class="sqn-badge">
          {{ cartCount > 99 ? '99+' : cartCount }}
        </span>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { slideDirection } from '@/composables/useSwipeNav'

const router = useRouter()
const route  = useRoute()
const cart   = useCartStore()

const cartCount = computed(() => cart.cartCount)

// ── Inline SVG icon components ──────────────────────────────────────────────
const IconHome = { render: () => h('svg', { width: 26, height: 26, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, viewBox: '0 0 24 24' },
  [h('path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }),
   h('polyline', { points: '9 22 9 12 15 12 15 22' })]) }

const IconCart = { render: () => h('svg', { width: 26, height: 26, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, viewBox: '0 0 24 24' },
  [h('circle', { cx: 9, cy: 21, r: 1 }),
   h('circle', { cx: 20, cy: 21, r: 1 }),
   h('path', { d: 'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' })]) }

const IconOrders = { render: () => h('svg', { width: 26, height: 26, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, viewBox: '0 0 24 24' },
  [h('path', { d: 'M6 2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
   h('polyline', { points: '14 2 14 8 20 8' }),
   h('line', { x1: 16, y1: 13, x2: 8, y2: 13 }),
   h('line', { x1: 16, y1: 17, x2: 8, y2: 17 })]) }

const IconProfile = { render: () => h('svg', { width: 26, height: 26, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, viewBox: '0 0 24 24' },
  [h('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
   h('circle', { cx: 12, cy: 7, r: 4 })]) }

const items = [
  { label: 'Home',    route: '/home',    icon: IconHome    },
  { label: 'Cart',    route: '/cart',    icon: IconCart    },
  { label: 'Orders',  route: '/orders',  icon: IconOrders  },
  { label: 'Profile', route: '/profile', icon: IconProfile },
]

const TAB_INDEX = Object.fromEntries(items.map((t, i) => [t.route, i]))

function isActive(item) {
  return route.path === item.route || route.path.startsWith(item.route + '/')
}

function navigate(item) {
  if (isActive(item)) return
  // Set slide direction so App.vue transition matches tap direction
  const from = TAB_INDEX[route.path] ?? -1
  const to   = TAB_INDEX[item.route] ?? -1
  if (from !== -1 && to !== -1) {
    slideDirection.value = to > from ? 'slide-left' : 'slide-right'
  }
  router.push(item.route)
}
</script>

<style scoped>
/* Shared transition curve for every state change in the nav (Material standard) */
.sqnav {
  position: fixed;
  bottom: 0;
  left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px;
  display: flex; align-items: flex-end; gap: 5px;
  padding: 0 30px 16px;
  background: linear-gradient(to bottom, #FDF0F5 0%, #F4C5DA 100%);
  z-index: 99;
  pointer-events: none;
}

.sqn-item {
  flex: 1;
  display: flex; justify-content: center; align-items: flex-end;
  pointer-events: all;
  cursor: pointer;
  transform-origin: bottom center;
  transition:
    transform 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    opacity   0.24s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}
.sqn-item.idle   { transform: scale(0.94); opacity: 0.72; }
.sqn-item.active { transform: scale(1.0); }

.sqn-squircle {
  width: 70%; aspect-ratio: 1;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #f0d6e4;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 3px;
  box-shadow: 0 3px 10px rgba(212,39,108,0.10), 0 1px 3px rgba(0,0,0,0.05);
  transition:
    background   0.24s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow   0.24s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.sqn-item.active .sqn-squircle {
  background: var(--primary);
  border-color: var(--primary);
  box-shadow: 0 6px 18px rgba(212,39,108,0.35), 0 2px 6px rgba(212,39,108,0.20);
}

.sqn-squircle svg {
  color: var(--primary);
  transition: color 0.24s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}
.sqn-item.active .sqn-squircle svg { color: #fff; }

.sqn-label {
  font-size: 11px; font-weight: 600;
  color: var(--primary); letter-spacing: 0.01em;
  transition: color 0.24s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  line-height: 1;
}
.sqn-item.active .sqn-label { color: #fff; }

.sqn-badge {
  position: absolute; top: 6px; right: 6px;
  background: var(--primary); color: white;
  font-size: 9px; font-weight: 700;
  min-width: 16px; height: 16px; padding: 0 3px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff;
  line-height: 1;
  transition:
    background   0.24s cubic-bezier(0.4, 0, 0.2, 1),
    color        0.24s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.24s cubic-bezier(0.4, 0, 0.2, 1);
}
.sqn-item.active .sqn-badge { background: white; color: var(--primary); border-color: var(--primary); }
</style>
