<template>
  <nav class="pill-nav" aria-label="Main navigation">
    <div
      v-for="item in items"
      :key="item.route"
      :class="['pill-tab', isActive(item) ? 'active' : '']"
      role="button"
      :aria-label="item.label"
      @click="navigate(item)"
    >
      <div class="pill-icon-wrap">
        <component :is="item.icon" />
        <span
          v-if="item.route === '/cart' && cartCount > 0"
          class="pill-badge"
        >{{ cartCount > 99 ? '99+' : cartCount }}</span>
      </div>
      <span class="pill-label">{{ item.label }}</span>
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

const IconHome = { render: () => h('svg', { width: 22, height: 22, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.9, viewBox: '0 0 24 24' },
  [h('path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }),
   h('polyline', { points: '9 22 9 12 15 12 15 22' })]) }

const IconCart = { render: () => h('svg', { width: 22, height: 22, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.9, viewBox: '0 0 24 24' },
  [h('circle', { cx: 9, cy: 21, r: 1 }),
   h('circle', { cx: 20, cy: 21, r: 1 }),
   h('path', { d: 'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' })]) }

const IconOrders = { render: () => h('svg', { width: 22, height: 22, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.9, viewBox: '0 0 24 24' },
  [h('path', { d: 'M6 2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
   h('polyline', { points: '14 2 14 8 20 8' }),
   h('line', { x1: 16, y1: 13, x2: 8, y2: 13 }),
   h('line', { x1: 16, y1: 17, x2: 8, y2: 17 })]) }

const IconProfile = { render: () => h('svg', { width: 22, height: 22, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.9, viewBox: '0 0 24 24' },
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
  const from = TAB_INDEX[route.path] ?? -1
  const to   = TAB_INDEX[item.route] ?? -1
  if (from !== -1 && to !== -1) {
    slideDirection.value = to > from ? 'slide-left' : 'slide-right'
  }
  router.push(item.route)
}
</script>

<style scoped>
/* ── Floating pill container ───────────────────────────────────────────── */
.pill-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 448px;
  margin-bottom: 14px;

  display: flex;
  align-items: center;
  justify-content: space-around;

  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(28px) saturate(1.8);
  -webkit-backdrop-filter: blur(28px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 50px;
  padding: 8px 6px;
  box-shadow:
    0 8px 32px rgba(212, 39, 108, 0.14),
    0 2px 8px  rgba(212, 39, 108, 0.08),
    inset 0  1px 0 rgba(255, 255, 255, 0.90),
    inset 0 -1px 0 rgba(255, 255, 255, 0.35),
    inset  1px 0 0 rgba(255, 255, 255, 0.50),
    inset -1px 0 0 rgba(255, 255, 255, 0.50);

  z-index: 99;
  pointer-events: none;

  -webkit-user-select: none;
  user-select: none;
}

/* ── Individual tab ────────────────────────────────────────────────────── */
.pill-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 7px 4px;
  border-radius: 40px;
  cursor: pointer;
  pointer-events: all;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.pill-tab.active {
  background: rgba(212, 39, 108, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
    0 2px 12px rgba(212, 39, 108, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

/* ── Icon wrapper (positions badge) ───────────────────────────────────── */
.pill-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.pill-tab svg {
  color: var(--primary);
  transition: color 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.pill-tab.active svg {
  color: #fff;
}

/* ── Label ─────────────────────────────────────────────────────────────── */
.pill-label {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--primary);
  letter-spacing: 0.01em;
  line-height: 1;
  pointer-events: none;
  transition: color 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.pill-tab.active .pill-label {
  color: #fff;
}

/* ── Cart badge ────────────────────────────────────────────────────────── */
.pill-badge {
  position: absolute;
  top: -5px;
  right: -7px;
  background: var(--primary);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #fff;
  line-height: 1;
  transition: background 0.22s, color 0.22s, border-color 0.22s;
}
.pill-tab.active .pill-badge {
  background: #fff;
  color: var(--primary);
  border-color: var(--primary);
}
</style>
