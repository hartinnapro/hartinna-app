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

  overflow: hidden;
  background: linear-gradient(
    180deg,
    #ffffff     0%,
    #fff2f7    18%,
    #fce4f0    50%,
    #f0cfe2    78%,
    #e2bdd4   100%
  );
  border: 1px solid rgba(240, 214, 228, 0.7);
  border-radius: 50px;
  padding: 8px 6px;
  box-shadow:
    0 4px 20px rgba(212, 39, 108, 0.12),
    0 1px 4px  rgba(212, 39, 108, 0.06),
    inset 0  2px 3px rgba(255, 240, 248, 1.00),
    inset 0 -6px 14px rgba(160, 60, 110, 0.18);

  z-index: 99;
  pointer-events: none;

  -webkit-user-select: none;
  user-select: none;
}

/* Pearl gloss — pink-tinted specular highlight, like light bouncing off a pearl */
.pill-nav::after {
  content: '';
  position: absolute;
  top: 0;
  left: 12%;
  right: 12%;
  height: 52%;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(255, 245, 250, 0.98) 0%,
    rgba(255, 230, 242, 0.70) 40%,
    rgba(255, 210, 235, 0.20) 70%,
    rgba(255, 200, 230, 0.00) 100%
  );
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

/* ── Individual tab ────────────────────────────────────────────────────── */
.pill-tab {
  position: relative;
  z-index: 1;
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

/* 3D gel button — light source from above */
.pill-tab.active {
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    #f575a0 0%,
    #e0347a 30%,
    #c0265e 70%,
    #9e1a4e 100%
  );
  box-shadow:
    0 6px 22px rgba(130, 15, 60, 0.55),
    0 2px 5px  rgba(130, 15, 60, 0.35),
    inset 0  2px 3px rgba(255, 255, 255, 0.55),
    inset 0 -5px 10px rgba(0,   0,   0,   0.28);
}

/* Oval specular highlight — the convex surface catching the light */
.pill-tab.active::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 10%;
  right: 10%;
  height: 44%;
  background: radial-gradient(
    ellipse at 50% 10%,
    rgba(255, 255, 255, 0.92) 0%,
    rgba(255, 255, 255, 0.55) 40%,
    rgba(255, 255, 255, 0.00) 80%
  );
  border-radius: 50%;
  pointer-events: none;
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
  transition: color 0.22s cubic-bezier(0.4, 0, 0.2, 1), filter 0.22s;
  /* Tight metallic line — highlight sits ON the top edge, shadow on bottom edge */
  filter:
    drop-shadow(0 -0.5px 0   rgba(255, 230, 240, 1.00))
    drop-shadow(0  0.5px 0   rgba(140,  15,  65, 0.60));
}
.pill-tab.active svg {
  color: #fff;
  /* Metallic white line */
  filter:
    drop-shadow(0 -0.5px 0   rgba(255, 255, 255, 1.00))
    drop-shadow(0  0.5px 0.5px rgba(70,   0,  25, 0.65));
}

/* ── Label ─────────────────────────────────────────────────────────────── */
.pill-label {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--primary);
  letter-spacing: 0.01em;
  line-height: 1;
  pointer-events: none;
  transition: color 0.22s cubic-bezier(0.4, 0, 0.2, 1), text-shadow 0.22s;
  /* Tight metallic pink line */
  text-shadow:
    0 -0.5px 0 rgba(255, 230, 240, 1.00),
    0  0.5px 0 rgba(140,  15,  65, 0.60);
}
.pill-tab.active .pill-label {
  font-weight: 500;
  color: #fff;
  /* Tight metallic white */
  text-shadow:
    0 -0.5px 0   rgba(255, 255, 255, 1.00),
    0  0.5px 0.5px rgba(70,   0,  25, 0.65);
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
