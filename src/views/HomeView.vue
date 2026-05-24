<template>
  <div>
    <!-- Skeleton -->
    <div v-if="state === 'loading'" class="sk-screen">
      <div class="sk-header">
        <div class="sk" style="width:36px;height:36px;border-radius:10px;"></div>
        <div class="sk" style="flex:1;height:20px;max-width:140px;"></div>
        <div class="sk" style="width:40px;height:36px;border-radius:8px;"></div>
      </div>
      <div class="sk-main" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div v-for="i in 6" :key="i" style="background:#fff;border-radius:14px;border:1px solid var(--border);padding:12px;overflow:hidden;">
          <div class="sk" style="width:100%;height:110px;border-radius:10px;margin-bottom:10px;"></div>
          <div class="sk" style="width:50%;height:11px;margin-bottom:6px;"></div>
          <div class="sk" style="width:80%;height:13px;margin-bottom:8px;"></div>
          <div class="sk" style="width:60%;height:16px;"></div>
        </div>
      </div>
    </div>

    <!-- Ready -->
    <template v-else>
      <!-- Header -->
      <header class="header">
        <div class="header-brand">
          <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4"  y="4" width="5" height="22" rx="2.5" fill="white"/>
            <rect x="21" y="4" width="5" height="22" rx="2.5" fill="white"/>
            <rect x="4" y="12.5" width="22" height="5" rx="2.5" fill="white" opacity="0.85"/>
          </svg>
        </div>
        <div class="header-info">
          <div class="header-name">{{ member.full_name }}</div>
          <div class="level-badge">{{ levelLabel }}</div>
        </div>
        <button class="header-cart" @click="router.push('/cart')" aria-label="Cart">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"
            :style="{ stroke: cartCount ? 'var(--primary)' : 'var(--text-muted)' }">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span class="cart-badge" v-if="cartCount">{{ cartCount }}</span>
        </button>
      </header>

      <!-- Products -->
      <main class="main">
        <div class="section-header">
          <div class="section-title">Products</div>
          <div class="product-count" v-if="products.length">{{ products.length }} items</div>
        </div>

        <div v-if="products.length === 0" class="empty">
          <svg width="48" height="48" fill="none" stroke="var(--primary)" stroke-width="1.5" viewBox="0 0 24 24">
            <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <p>No products available yet.</p>
        </div>

        <div class="product-grid" v-else>
          <div
            class="product-card"
            :class="{ focused: focusedId === p.id }"
            v-for="(p, idx) in products"
            :key="p.id"
            :style="{ animationDelay: (idx * 0.06) + 's' }"
            @click="toggleFocus(p)"
          >
            <div class="product-img">
              <img v-if="p.image_url" :src="p.image_url" :alt="p.name" loading="lazy" />
              <div v-else class="product-img-placeholder">
                <div class="product-initial">{{ p.name[0] }}</div>
              </div>
            </div>

            <div class="product-body">
              <div class="product-sku">{{ p.sku }}</div>
              <div class="product-name">{{ p.name }}</div>
              <div class="product-price">
                MYR {{ price(p).toFixed(2) }}
                <span>/ unit</span>
              </div>
              <div class="product-minqty" v-if="minQty(p) > 1">
                Min. {{ minQty(p) }} units
              </div>
            </div>

            <div class="product-footer" @click.stop>
              <div class="qty-stepper">
                <button class="qty-btn" @click="decQty(p)" :disabled="localQty(p.id) <= 0">−</button>
                <div class="qty-val">{{ localQty(p.id) }}</div>
                <button class="qty-btn" @click="incQty(p)">+</button>
              </div>
              <button
                :class="['btn-add', cart.inCart(p.id) ? 'in-cart' : '']"
                @click="addToCart(p)"
              >
                {{ cart.inCart(p.id) ? '✓ Added' : 'Add' }}
              </button>
            </div>
          </div>
        </div>
      </main>
    </template>

    <!-- Toast -->
    <div :class="['toast', toast.visible ? '' : 'hide']" aria-live="polite">{{ toast.msg }}</div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { guardedSession } from '@/lib/session'
import { hppGetCache, hppSetCache } from '@/lib/cache'
import { useCartStore } from '@/stores/cart'
const router = useRouter()
const cart   = useCartStore()

const state   = ref('loading')
const member  = reactive({ full_name: '', level: '' })
const products = ref([])
const focusedId = ref(null)

function toggleFocus(p) {
  focusedId.value = focusedId.value === p.id ? null : p.id
}

function handleOutsideClick(e) {
  if (focusedId.value && !e.target.closest('.product-card')) {
    focusedId.value = null
  }
}
const localQtys = reactive({}) // stepper values not yet committed to cart
const toast   = reactive({ msg: '', visible: false })
let toastTimer = null

const LEVEL_LABELS = {
  store_manager:    'Store Manager',
  director:         'Director',
  ceo:              'CEO',
  branch:           'Branch',
  exec_shareholder: 'Exec. Shareholder'
}

const levelLabel = computed(() => LEVEL_LABELS[member.level] || member.level)
const cartCount  = computed(() => cart.cartCount)

// ── Helpers ──────────────────────────────────────────────────────────────────
function price(p)  { return p.product_prices?.[0]?.price  ?? 0 }
function minQty(p) { return p.product_prices?.[0]?.min_qty ?? 1 }
function localQty(id) { return localQtys[id] ?? 0 }

function showToast(msg) {
  clearTimeout(toastTimer)
  toast.msg = msg; toast.visible = true
  toastTimer = setTimeout(() => { toast.visible = false }, 2000)
}

// ── Qty controls ──────────────────────────────────────────────────────────────
function incQty(p) {
  localQtys[p.id] = (localQtys[p.id] ?? 0) + 1
}

function decQty(p) {
  if ((localQtys[p.id] ?? 0) <= 0) return
  localQtys[p.id]--
  if (localQtys[p.id] === 0 && cart.inCart(p.id)) {
    cart.remove(p.id)
  }
}

function addToCart(p) {
  const qty = localQtys[p.id] ?? 0
  const min = minQty(p)
  if (qty === 0) {
    localQtys[p.id] = min
    cart.addToCart(p, min)
    showToast(`Added ${p.name} ×${min}`)
  } else if (qty < min) {
    showToast(`Minimum order is ${min} units`)
  } else {
    cart.addToCart(p, qty)
    showToast(`Added ${p.name} ×${qty}`)
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  const session = await guardedSession()
  if (!session) { router.push('/login'); return }

  cart.load()

  // Restore local qtys from cart
  Object.entries(cart.items).forEach(([id, item]) => {
    localQtys[id] = item.qty
  })

  const uid  = session.user.id
  const CKEY = `hpp_home_${uid}`
  const cached = hppGetCache(CKEY)

  if (cached) {
    if (cached.member) { member.full_name = cached.member.full_name; member.level = cached.member.level }
    products.value = cached.products ?? []
    state.value = 'ready'
  }

  try {
    const [{ data: m }, { data: prods }] = await Promise.all([
      supabase.from('members').select('full_name, level').eq('id', uid).single(),
      supabase.from('products')
        .select('id, sku, name, image_url, sort_order, product_prices(price, min_qty)')
        .eq('is_active', true).is('deleted_at', null).order('sort_order')
    ])
    if (m) { member.full_name = m.full_name; member.level = m.level }
    products.value = prods ?? []
    hppSetCache(CKEY, { member: m, products: prods ?? [] })
  } catch (e) { console.error('Load error:', e) }

  if (!cached) state.value = 'ready'
})

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
/* Header */
.header {
  position: sticky; top: 0; z-index: 100;
  height: var(--header-h);
  background: var(--card);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center;
  padding: 0 16px; gap: 12px;
  box-shadow: 0 2px 12px rgba(44,24,16,0.06);
  animation: reveal 0.28s ease both;
}
.header-brand {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.header-brand svg { width: 18px; height: 18px; }
.header-info { flex: 1; min-width: 0; }
.header-name {
  font-size: 14px; font-weight: 600; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.level-badge {
  display: inline-block;
  font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--primary); background: var(--primary-light);
  padding: 2px 7px; border-radius: 20px; margin-top: 2px;
}
.header-cart {
  position: relative; width: 40px; height: 40px;
  background: none; border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: border-color 0.15s, background 0.15s;
}
.header-cart:hover { border-color: var(--primary); background: var(--primary-light); }
.cart-badge {
  position: absolute; top: -5px; right: -5px;
  background: var(--primary); color: white;
  font-size: 10px; font-weight: 700;
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--bg);
}

/* Main */
.main { padding: 16px 16px 120px; animation: reveal 0.32s ease both 0.07s; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.section-title { font-family: var(--font-display); font-size: 19px; color: var(--text); }
.product-count { font-size: 12px; color: var(--text-muted); }

/* Empty */
.empty { text-align: center; padding: 60px 24px; color: var(--text-muted); }
.empty svg { opacity: 0.2; margin-bottom: 14px; display: block; margin-left: auto; margin-right: auto; }
.empty p { font-size: 13.5px; }

/* Product grid */
.product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.product-card {
  animation: reveal 0.30s ease backwards;
  background: var(--card);
  border-radius: var(--radius);
  border: 1px solid rgba(232,216,212,0.6);
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(44,24,16,0.06);
  display: flex; flex-direction: column;
  transition:
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.28s ease,
    opacity 0.22s ease,
    filter 0.22s ease;
  cursor: pointer;
  position: relative;
  z-index: 1;
}

/* Focused — lifted hero state */
/* Anchor scale to the OUTER corner of each card so the enlargement grows
   inward (toward the grid centre) and downward, never off-screen or into
   the header above. */
.product-card:nth-child(odd)  { transform-origin: top left;  }  /* left column  */
.product-card:nth-child(even) { transform-origin: top right; }  /* right column */

.product-card.focused {
  transform: scale(1.3);
  box-shadow:
    0 24px 60px rgba(212,39,108,0.22),
    0 8px 20px rgba(44,24,16,0.14);
  z-index: 5;
}

.product-img {
  aspect-ratio: 1; position: relative;
  background: linear-gradient(135deg, #FDF0F2, #FBF3EE);
  overflow: hidden;
}
.product-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.product-img-placeholder {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
.product-initial {
  font-family: var(--font-display);
  font-size: 32px; color: var(--primary);
  opacity: 0.25; font-weight: 600; line-height: 1;
}

.product-body {
  padding: 11px 12px 8px; flex: 1;
  display: flex; flex-direction: column; gap: 3px;
}
.product-name {
  font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.product-sku { font-size: 10.5px; color: var(--text-muted); letter-spacing: 0.04em; }
.product-price { font-size: 15px; font-weight: 700; color: var(--primary); margin-top: 3px; }
.product-price span { font-size: 11px; font-weight: 400; color: var(--text-muted); }
.product-minqty { font-size: 10.5px; color: var(--text-muted); }

.product-footer {
  padding: 0 12px 12px;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}

/* Qty stepper */
.qty-stepper {
  display: flex; align-items: center;
  border: 1.5px solid var(--border); border-radius: var(--radius-xs); overflow: hidden;
}
.qty-btn {
  width: 28px; height: 28px; background: none; border: none;
  cursor: pointer; font-size: 16px; color: var(--primary);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s; flex-shrink: 0;
}
.qty-btn:hover { background: var(--primary-light); }
.qty-btn:disabled { color: var(--border); cursor: not-allowed; }
.qty-val {
  width: 30px; text-align: center;
  font-size: 13px; font-weight: 600; color: var(--text);
  border-left: 1px solid var(--border); border-right: 1px solid var(--border);
  line-height: 28px;
}

/* Add button */
.btn-add {
  padding: 7px 12px;
  background: var(--primary); color: white;
  border: none; border-radius: var(--radius-xs);
  font-family: var(--font-body); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.btn-add:hover { opacity: 0.88; }
.btn-add.in-cart { background: var(--success); }

/* Toast */
.toast {
  position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
  background: rgba(44,24,16,0.88); color: white;
  padding: 10px 18px; border-radius: 24px;
  font-size: 13px; font-weight: 500;
  white-space: nowrap; z-index: 200;
  transition: opacity 0.25s, transform 0.25s;
  pointer-events: none;
}
.toast.hide { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>
