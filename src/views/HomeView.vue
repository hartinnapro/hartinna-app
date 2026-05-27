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
            :class="{ focused: focusedId === p.id, revealed: revealedIds.has(p.id) }"
            :data-product-id="p.id"
            v-for="(p, idx) in products"
            :key="p.id"
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
              </div>
              <div class="product-minqty" v-if="minQty(p) > 1">
                Min. {{ minQty(p) }} units
              </div>
            </div>

            <div class="product-footer" @click.stop>
              <div class="qty-stepper">
                <button class="qty-btn" @click="decQty(p)" :disabled="localQty(p.id) <= 1">−</button>
                <input
                  class="qty-val"
                  type="text"
                  inputmode="numeric"
                  :value="localQty(p.id)"
                  @change="setQty(p, $event.target.value)"
                  @focus="$event.target.select()"
                  @click.stop
                />
                <button class="qty-btn" @click="incQty(p)">+</button>
              </div>
              <button
                class="btn-add"
                :class="{ feedback: feedbackIds.has(p.id) }"
                @click.stop="handleAddToCart(p, $event)"
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <svg v-if="feedbackIds.has(p.id)" class="tick-icon" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span v-if="cart.getQty(p.id) > 0" class="btn-cart-badge">{{ cart.getQty(p.id) }}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </template>

    <!-- Toast -->
    <div :class="['toast', toast.visible ? '' : 'hide']" aria-live="polite">{{ toast.msg }}</div>

    <!-- Flying hearts -->
    <Teleport to="body">
      <div v-for="h in flyingHearts" :key="h.id" class="flying-heart" :style="h.style">
        <svg :width="h.size" :height="h.size" viewBox="0 0 24 24" :fill="h.color">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
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
  const wasFocused = focusedId.value === p.id
  focusedId.value = wasFocused ? null : p.id

  // When newly focused, scroll the card to the top of the viewport so the
  // enlarged (scale 1.3) version has room to grow downward without clipping.
  // 16px buffer below the page top so the card doesn't sit flush against
  // the very top edge.
  if (!wasFocused) {
    nextTick(() => {
      const el = document.querySelector(`[data-product-id="${p.id}"]`)
      if (!el) return
      const targetY = el.getBoundingClientRect().top + window.scrollY - 16
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    })
  }
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
function localQty(id) { return localQtys[id] ?? 1 }

function showToast(msg) {
  clearTimeout(toastTimer)
  toast.msg = msg; toast.visible = true
  toastTimer = setTimeout(() => { toast.visible = false }, 2000)
}

// ── Qty controls ──────────────────────────────────────────────────────────────
function incQty(p) {
  localQtys[p.id] = (localQtys[p.id] ?? 1) + 1
}

function decQty(p) {
  if ((localQtys[p.id] ?? 1) <= 1) return
  localQtys[p.id]--
}

function setQty(p, val) {
  const n = parseInt(val)
  if (isNaN(n) || n < 1) { localQtys[p.id] = 1; return }
  localQtys[p.id] = n
}

// ── Add to cart with hearts animation ─────────────────────────────────────────
const feedbackIds    = reactive(new Set())
const feedbackTimers = new Map()
const activeAnims    = reactive(new Set())
const flyingHearts   = reactive([])

function handleAddToCart(p, event) {
  const qty = localQtys[p.id] ?? 0
  const min = minQty(p)

  let actualQty
  if (qty === 0) {
    actualQty = min
    localQtys[p.id] = min
  } else if (qty < min) {
    showToast(`Minimum order is ${min} units`)
    return
  } else {
    actualQty = qty
  }

  cart.addToCart(p, cart.getQty(p.id) + actualQty)
  localQtys[p.id] = 1  // reset stepper after each add

  // Reset 1.5s feedback timer on every tap
  clearTimeout(feedbackTimers.get(p.id))
  feedbackIds.add(p.id)
  feedbackTimers.set(p.id, setTimeout(() => {
    feedbackIds.delete(p.id)
    feedbackTimers.delete(p.id)
    activeAnims.delete(p.id)
  }, 1500))

  // Hearts: throttle to one animation at a time
  if (!activeAnims.has(p.id)) {
    activeAnims.add(p.id)
    launchHearts(event.currentTarget)
  }
}

function launchHearts(buttonEl) {
  if (!buttonEl) return
  const cartEl = document.querySelector('.header-cart')
  if (!cartEl) return

  const sr = buttonEl.getBoundingClientRect()
  const tr = cartEl.getBoundingClientRect()
  const sx = sr.left + sr.width  / 2
  const sy = sr.top  + sr.height / 2
  const tx = tr.left + tr.width  / 2
  const ty = tr.top  + tr.height / 2

  const colors   = ['#ffc0d8', '#ff85b3', '#ff5590', '#D4276C', '#f47eb0']
  const sizes    = [10, 16, 12, 18, 14]
  const count    = 5

  for (let i = 0; i < count; i++) {
    const id       = `h${Date.now()}${i}`
    const scatterX = (Math.random() - 0.5) * 90
    const scatterY = -(40 + Math.random() * 50)
    const rot1     = (Math.random() - 0.5) * 40
    const rot2     = (Math.random() - 0.5) * 60
    const duration = 720
    const delay    = i * 70

    // Inject unique keyframe
    const kfName = `hfly${id}`
    const styleTag = document.createElement('style')
    styleTag.id = `kf-${id}`
    styleTag.textContent = `
      @keyframes ${kfName} {
        0%   { transform: translate(${sx}px,${sy}px) scale(1) rotate(0deg); opacity:1; }
        30%  { transform: translate(${sx+scatterX}px,${sy+scatterY}px) scale(1.4) rotate(${rot1}deg); opacity:1; }
        100% { transform: translate(${tx}px,${ty}px) scale(0.1) rotate(${rot2}deg); opacity:0; }
      }
    `
    document.head.appendChild(styleTag)

    flyingHearts.push({
      id,
      size:  sizes[i],
      color: colors[i],
      style: {
        position:      'fixed',
        left:          '0',
        top:           '0',
        pointerEvents: 'none',
        zIndex:        '9999',
        animation:     `${kfName} ${duration}ms ${delay}ms cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
      }
    })

    // Cleanup after animation completes
    setTimeout(() => {
      const idx = flyingHearts.findIndex(h => h.id === id)
      if (idx !== -1) flyingHearts.splice(idx, 1)
      document.getElementById(`kf-${id}`)?.remove()
    }, duration + delay + 100)
  }
}

// ── Scroll reveal ─────────────────────────────────────────────────────────────
const revealedIds   = reactive(new Set())
let   revealObserver = null

async function setupScrollReveal() {
  await nextTick()
  const cards = Array.from(document.querySelectorAll('.product-card[data-product-id]'))
  if (!cards.length) return

  const pageLoadTime = Date.now()

  revealObserver?.disconnect()
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const id           = entry.target.dataset.productId
      const isInitialLoad = Date.now() - pageLoadTime < 800
      const idx           = cards.indexOf(entry.target)
      const delay         = isInitialLoad ? idx * 70 : 0
      setTimeout(() => revealedIds.add(id), delay)
      revealObserver.unobserve(entry.target)
    })
  }, { threshold: 0.08 })

  cards.forEach(c => revealObserver.observe(c))
}

watch(state, val => { if (val === 'ready') setupScrollReveal() })
// Re-run when products list refreshes from API (after cache hit)
watch(() => products.value.length, () => { if (state.value === 'ready') setupScrollReveal() })
onMounted(async () => {
  const session = await guardedSession()
  if (!session) { router.push('/login'); return }

  cart.load()

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
  revealObserver?.disconnect()
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
  /* Scroll reveal — starts hidden, shifted down, slightly zoomed */
  opacity: 0;
  transform: translateY(32px) scale(1.06);
  transition:
    opacity   0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    transform 0.75s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow 0.28s ease,
    filter     0.22s ease;

  background: var(--card);
  border-radius: var(--radius);
  border: 1px solid rgba(232,216,212,0.6);
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(44,24,16,0.06);
  display: flex; flex-direction: column;
  cursor: pointer;
  position: relative;
  z-index: 1;
}

/* Once revealed — switch to fast transitions for tap interactions */
.product-card.revealed {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition:
    opacity    0.15s ease,
    transform  0.28s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.28s ease,
    filter     0.22s ease;
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
.product-img img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  transform: scale(1.14);
  transition: transform 0.85s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
/* Image settles to natural size once card is revealed */
.product-card.revealed .product-img img {
  transform: scale(1);
}
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
  width: 42px; height: 28px;
  text-align: center;
  font-size: 13px; font-weight: 600; color: var(--text);
  font-family: var(--font-body);
  border: none;
  border-left: 1px solid var(--border); border-right: 1px solid var(--border);
  background: none; outline: none;
  padding: 0;
  -webkit-appearance: none;
  line-height: 28px;
}

/* Cart qty badge on add button */
.btn-add {
  position: relative;
  padding: 7px 10px;
  background: var(--primary); color: white;
  border: 1.5px solid transparent;
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  transition: background 0.22s, color 0.22s, border-color 0.22s, box-shadow 0.22s;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
.btn-add:active { transform: scale(0.88); }

.btn-cart-badge {
  position: absolute;
  top: -6px; right: -6px;
  background: white;
  color: var(--primary);
  border: 1.5px solid var(--primary);
  font-size: 9px; font-weight: 700;
  min-width: 16px; height: 16px;
  padding: 0 3px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  line-height: 1; pointer-events: none;
}
.btn-add.feedback .btn-cart-badge {
  background: var(--primary);
  color: white;
  border-color: white;
}

/* Option D: invert colours + scale-up wiggle */
.btn-add.feedback {
  background: white;
  color: var(--primary);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(212, 39, 108, 0.20);
  animation: btn-wiggle 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes btn-wiggle {
  0%   { transform: scale(1.20) rotate(0deg);   }
  20%  { transform: scale(1.12) rotate(-10deg);  }
  40%  { transform: scale(1.06) rotate( 10deg);  }
  60%  { transform: scale(1.03) rotate(-6deg);   }
  80%  { transform: scale(1.01) rotate( 4deg);   }
  100% { transform: scale(1)    rotate(0deg);    }
}

.tick-icon {
  animation: tick-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes tick-pop {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

/* Flying hearts are positioned via inline styles */
.flying-heart { pointer-events: none; }

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
