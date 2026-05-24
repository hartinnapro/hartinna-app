<template>
  <div>
    <header class="header">
      <button class="back-btn" @click="router.push('/home')" aria-label="Back">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <div class="header-title">My Cart</div>
      <div class="header-count" v-if="cartList.length">
        {{ cartList.length }} item{{ cartList.length > 1 ? 's' : '' }}
      </div>
    </header>

    <main class="main">
      <!-- Empty state -->
      <div v-if="cartList.length === 0" class="empty">
        <svg width="56" height="56" fill="none" stroke="var(--primary)" stroke-width="1.5" viewBox="0 0 24 24">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <h3>Your cart is empty</h3>
        <p>Add products from the catalogue to get started.</p>
        <button class="btn-outline" @click="router.push('/home')">Browse Products</button>
      </div>

      <template v-else>
        <!-- Items -->
        <div class="section-label">Order Items</div>

        <div class="cart-item" v-for="item in cartList" :key="item.product.id">
          <div class="item-img">
            <img v-if="item.product.image_url" :src="item.product.image_url" :alt="item.product.name" />
            <span v-else>{{ item.product.name[0] }}</span>
          </div>
          <div class="item-info">
            <div class="item-sku">{{ item.product.sku }}</div>
            <div class="item-name">{{ item.product.name }}</div>
            <div class="item-row">
              <div class="item-prices">
                <div class="item-subtotal">{{ formatRM(itemSubtotal(item)) }}</div>
                <div v-if="item.qty > 1" class="item-unit-price">
                  {{ formatRM(unitPrice(item)) }} × {{ item.qty }}
                </div>
              </div>
              <div class="qty-stepper">
                <button class="qty-btn" @click="decQty(item)" aria-label="Decrease quantity">−</button>
                <div class="qty-val">{{ item.qty }}</div>
                <button class="qty-btn" @click="incQty(item)" aria-label="Increase quantity">+</button>
              </div>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Pickup method — iOS-style segmented control -->
        <div class="section-label">Pickup Method</div>
        <div class="seg-track" :data-pickup="pickup">
          <div class="seg-indicator"></div>
          <button
            type="button"
            class="seg-option"
            :class="{ active: pickup === 'self_pickup' }"
            @click="pickup = 'self_pickup'"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Self Pickup</span>
          </button>
          <button
            type="button"
            class="seg-option"
            :class="{ active: pickup === 'delivery' }"
            @click="pickup = 'delivery'"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span>Delivery</span>
          </button>
        </div>

        <!-- Delivery fields -->
        <template v-if="pickup === 'delivery'">
          <div class="form-group">
            <label for="cart-recipient-name">Recipient Name</label>
            <input id="cart-recipient-name" name="recipient-name" autocomplete="name" v-model="delivery.name" type="text" placeholder="Full name" :class="{ err: errors.name }" />
            <div v-if="errors.name" class="field-error">{{ errors.name }}</div>
          </div>
          <div class="form-group">
            <label for="cart-recipient-phone">Recipient Phone</label>
            <input id="cart-recipient-phone" name="recipient-phone" autocomplete="tel" v-model="delivery.phone" type="tel" placeholder="+60123456789" :class="{ err: errors.phone }" />
            <div v-if="errors.phone" class="field-error">{{ errors.phone }}</div>
          </div>
          <div class="form-group">
            <label for="cart-delivery-address">Delivery Address</label>
            <textarea id="cart-delivery-address" name="delivery-address" autocomplete="street-address" v-model="delivery.address" placeholder="Full address including postcode and state" :class="{ err: errors.address }"></textarea>
            <div v-if="errors.address" class="field-error">{{ errors.address }}</div>
          </div>
        </template>

        <!-- Remarks -->
        <div class="form-group remarks-group">
          <label for="cart-remarks">Remarks <span class="opt">(optional)</span></label>
          <textarea id="cart-remarks" name="remarks" v-model="remarks" placeholder="Any special instructions or notes…" style="min-height:60px;"></textarea>
        </div>

        <div v-if="alertMsg" class="alert alert-error">{{ alertMsg }}</div>

        <!-- CTA with total baked in -->
        <button class="btn-primary" @click="proceed">
          <span>Continue to Payment</span>
          <span class="cta-sep">·</span>
          <span class="cta-total">{{ formatRM(grandTotal) }}</span>
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </template>
    </main>

    <!-- Remove confirmation — bottom sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showRemoveModal" class="sheet-backdrop" @click.self="cancelRemove">
          <div class="sheet" role="dialog" aria-labelledby="remove-sheet-title">
            <div class="sheet-handle"></div>
            <div id="remove-sheet-title" class="sheet-title">Remove from cart?</div>
            <div class="sheet-product">
              <strong>{{ pendingRemoveItem?.product?.name }}</strong>
            </div>
            <div class="sheet-actions">
              <button class="btn-sheet-cancel" @click="cancelRemove">Cancel</button>
              <button class="btn-sheet-remove" @click="confirmRemove">Remove</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { guardedSession } from '@/lib/session'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cart   = useCartStore()

const PICKUP_KEY = 'hpp_pickup_method'

// Pickup method: sticky from last choice (self_pickup default)
const pickup  = ref(localStorage.getItem(PICKUP_KEY) || 'self_pickup')
watch(pickup, (newVal) => {
  try { localStorage.setItem(PICKUP_KEY, newVal) } catch {}
})

const remarks  = ref('')
const delivery = reactive({ name: '', phone: '', address: '' })
const errors   = reactive({})
const alertMsg = ref('')

// Remove confirmation state
const showRemoveModal   = ref(false)
const pendingRemoveItem = ref(null)

const cartList   = computed(() => cart.cartList)
const grandTotal = computed(() => cart.grandTotal)

function unitPrice(item)    { return item.product.product_prices?.[0]?.price ?? 0 }
function itemSubtotal(item) { return unitPrice(item) * item.qty }

// Format: RM 1,234.50 (Malaysian local style with thousands separator)
function formatRM(amount) {
  const num = Number(amount || 0).toFixed(2)
  const [intPart, decPart] = num.split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `RM ${withCommas}.${decPart}`
}

function incQty(item) {
  cart.updateQty(item.product.id, item.qty + 1)
}

// At qty 1, hitting minus opens the remove-confirmation sheet.
// At qty > 1, it just decrements as before.
function decQty(item) {
  if (item.qty <= 1) {
    pendingRemoveItem.value = item
    showRemoveModal.value = true
  } else {
    cart.updateQty(item.product.id, item.qty - 1)
  }
}

function cancelRemove() {
  showRemoveModal.value = false
  pendingRemoveItem.value = null
}

function confirmRemove() {
  if (pendingRemoveItem.value) {
    cart.remove(pendingRemoveItem.value.product.id)
  }
  showRemoveModal.value = false
  pendingRemoveItem.value = null
}

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  alertMsg.value = ''
  if (cartList.value.length === 0) { alertMsg.value = 'Your cart is empty.'; return false }

  for (const item of cartList.value) {
    const min = item.product.product_prices?.[0]?.min_qty ?? 1
    if (item.qty < min) {
      alertMsg.value = `Minimum order for ${item.product.name} is ${min} units.`
      return false
    }
  }

  if (pickup.value === 'delivery') {
    if (!delivery.name.trim())    errors.name    = 'Recipient name is required'
    if (!delivery.phone.trim())   errors.phone   = 'Recipient phone is required'
    if (!delivery.address.trim()) errors.address = 'Delivery address is required'
    if (Object.keys(errors).length) { window.scrollTo({ top: 0, behavior: 'smooth' }); return false }
  }
  return true
}

function proceed() {
  if (!validate()) return
  const draft = {
    items:    cartList.value,
    pickup:   pickup.value,
    delivery: pickup.value === 'delivery' ? { ...delivery } : null,
    remarks:  remarks.value.trim(),
    total:    grandTotal.value
  }
  try { localStorage.setItem('hpp_order_draft', JSON.stringify(draft)) } catch {}
  router.push('/payment')
}

onMounted(async () => {
  const session = await guardedSession()
  if (!session) { router.push('/login'); return }
  cart.load()
})
</script>

<style scoped>
.header {
  position: sticky; top: 0; z-index: 100; height: var(--header-h);
  background: var(--card); border-bottom: 1px solid var(--border);
  display: flex; align-items: center; padding: 0 16px; gap: 12px;
  box-shadow: 0 2px 12px rgba(44,24,16,0.06);
}
.back-btn {
  width: 36px; height: 36px; background: none;
  border: 1.5px solid var(--border); border-radius: var(--radius-xs);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); flex-shrink: 0; transition: border-color 0.15s, color 0.15s;
}
.back-btn:hover { border-color: var(--primary); color: var(--primary); }
.header-title { flex: 1; font-family: var(--font-display); font-size: 18px; color: var(--text); }
.header-count { font-size: 12px; color: var(--text-muted); }

.main { padding: 16px 16px 120px; }

.empty { text-align: center; padding: 60px 24px; color: var(--text-muted); }
.empty svg { opacity: 0.2; margin-bottom: 14px; display: block; margin-left: auto; margin-right: auto; }
.empty h3  { font-family: var(--font-display); font-size: 18px; color: var(--text); margin-bottom: 8px; }
.empty p   { font-size: 13.5px; margin-bottom: 20px; }
.btn-outline {
  display: inline-block; padding: 11px 24px;
  border: 1.5px solid var(--primary); border-radius: var(--radius-sm);
  color: var(--primary); font-family: var(--font-body);
  font-size: 14px; font-weight: 600; cursor: pointer; background: none;
}
.btn-outline:hover { background: var(--primary-light); }

.section-label {
  font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px;
}

/* ── Cart items ─────────────────────────────────────────────────────────── */
.cart-item {
  background: var(--card); border-radius: var(--radius);
  border: 1px solid rgba(232,216,212,0.6);
  padding: 14px; display: flex; gap: 12px;
  margin-bottom: 10px; box-shadow: 0 2px 8px rgba(44,24,16,0.05);
}
.item-img {
  width: 56px; height: 56px; border-radius: var(--radius-xs);
  background: linear-gradient(135deg, #FDF0F2, #FBF3EE);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  font-family: var(--font-display); font-size: 20px; color: var(--primary);
  overflow: hidden;
}
.item-img img { width: 100%; height: 100%; object-fit: cover; }
.item-info { flex: 1; min-width: 0; }
.item-sku  { font-size: 10.5px; color: var(--text-muted); letter-spacing: 0.04em; }
.item-name { font-size: 14px; font-weight: 600; color: var(--text); margin: 2px 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-row  { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.item-prices { min-width: 0; }
.item-subtotal   { font-size: 14px; font-weight: 700; color: var(--primary); line-height: 1.2; }
.item-unit-price { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.qty-stepper { display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: var(--radius-xs); overflow: hidden; }
.qty-btn { width: 28px; height: 28px; background: none; border: none; cursor: pointer; font-size: 16px; color: var(--primary); display: flex; align-items: center; justify-content: center; transition: background 0.12s; flex-shrink: 0; -webkit-tap-highlight-color: transparent; }
.qty-btn:hover { background: var(--primary-light); }
.qty-val { width: 32px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text); border-left: 1px solid var(--border); border-right: 1px solid var(--border); line-height: 28px; }

.divider { height: 1px; background: var(--border); margin: 20px 0; }

/* ── iOS-style segmented control ────────────────────────────────────────── */
.seg-track {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--primary-light);
  border-radius: var(--radius-sm);
  padding: 4px;
  margin-bottom: 14px;
  isolation: isolate; /* contain z-index */
}
.seg-indicator {
  position: absolute;
  top: 4px; bottom: 4px; left: 4px;
  width: calc(50% - 4px);
  background-color: var(--primary);
  /* Four radial layers of pink at varied positions create the "fog";
     the over-sized background (220%) lets background-position animate the
     fog slowly across the pill without revealing edges. */
  background-image:
    radial-gradient(ellipse at 20% 20%, rgba(255,210,235,0.42) 0%, transparent 55%),
    radial-gradient(ellipse at 80% 80%, rgba(184,31,90,0.55)   0%, transparent 55%),
    radial-gradient(ellipse at 70% 30%, rgba(232,160,200,0.30) 0%, transparent 45%),
    radial-gradient(ellipse at 30% 70%, rgba(212,39,108,0.50)  0%, transparent 50%);
  background-size: 220% 220%;
  border-radius: 6px;
  /* Two-layer pink glow + subtle inner top highlight */
  box-shadow:
    0 2px 6px  rgba(212,39,108,0.30),
    0 6px 20px rgba(212,39,108,0.38),
    inset 0 1px 0 rgba(255,255,255,0.18);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
  animation: pill-fog 8s ease-in-out infinite;
}

@keyframes pill-fog {
  0%   { background-position:   0% 50%; }
  25%  { background-position: 100%  0%; }
  50%  { background-position: 100% 100%; }
  75%  { background-position:   0% 100%; }
  100% { background-position:   0% 50%; }
}

/* Respect users who request less motion */
@media (prefers-reduced-motion: reduce) {
  .seg-indicator { animation: none; }
}
.seg-track[data-pickup="self_pickup"] .seg-indicator { transform: translateX(0); }
.seg-track[data-pickup="delivery"]    .seg-indicator { transform: translateX(100%); }
.seg-option {
  position: relative; z-index: 1;
  background: none; border: none; cursor: pointer;
  padding: 11px 8px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-family: var(--font-body); font-size: 13px; font-weight: 600;
  color: var(--text-muted);
  transition: color 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none; user-select: none;
}
.seg-option.active { color: white; }

/* ── Form controls ──────────────────────────────────────────────────────── */
.form-group { margin-bottom: 14px; }
.remarks-group { margin-top: 18px; margin-bottom: 22px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 6px; }
.opt { font-size: 11px; color: var(--text-muted); font-weight: 400; margin-left: 4px; }
input[type="text"], input[type="tel"], textarea {
  width: 100%; padding: 12px 14px;
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-family: var(--font-body); font-size: 14px; color: var(--text);
  background: #FDFAF8; outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
  -webkit-appearance: none; box-sizing: border-box;
}
input:focus, textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(212,39,108,0.1); background: white; }
input::placeholder, textarea::placeholder { color: #C5ABA8; }
input.err, textarea.err { border-color: var(--error); }
textarea { resize: none; min-height: 80px; }
.field-error { font-size: 12px; color: var(--error); margin-top: 4px; }

.alert { padding: 11px 14px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 14px; line-height: 1.5; }
.alert-error { background: #FEF0EE; color: var(--error); border: 1px solid #F5C6C2; }

/* ── Primary CTA with embedded total ────────────────────────────────────── */
.btn-primary {
  width: 100%; padding: 15px 18px;
  background: linear-gradient(135deg, var(--primary) 0%, #E0408A 100%);
  color: white; border: none; border-radius: var(--radius-sm);
  font-family: var(--font-body); font-size: 15px; font-weight: 600;
  cursor: pointer; box-shadow: 0 4px 16px rgba(212,39,108,0.33);
  transition: opacity 0.15s, transform 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  -webkit-tap-highlight-color: transparent;
}
.btn-primary:hover { opacity: 0.91; transform: translateY(-1px); }
.btn-primary .cta-sep   { opacity: 0.55; font-weight: 400; }
.btn-primary .cta-total { font-weight: 700; }

/* ── Bottom-sheet remove modal ──────────────────────────────────────────── */
.sheet-backdrop {
  position: fixed; inset: 0;
  background: rgba(44,24,16,0.45);
  z-index: 200;
  display: flex; align-items: flex-end; justify-content: center;
}
.sheet {
  width: 100%; max-width: 480px;
  background: var(--card);
  border-radius: 18px 18px 0 0;
  padding: 10px 22px 28px;
  box-shadow: 0 -8px 30px rgba(44,24,16,0.18);
}
.sheet-handle {
  width: 38px; height: 4px;
  background: var(--border);
  border-radius: 2px;
  margin: 0 auto 16px;
}
.sheet-title {
  font-family: var(--font-display);
  font-size: 19px; color: var(--text);
  text-align: center; margin-bottom: 6px;
}
.sheet-product {
  font-size: 13.5px; color: var(--text-muted);
  text-align: center; margin-bottom: 22px;
}
.sheet-product strong { color: var(--text); font-weight: 600; }
.sheet-actions {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.btn-sheet-cancel,
.btn-sheet-remove {
  padding: 13px;
  border-radius: var(--radius-sm);
  font-family: var(--font-body); font-size: 14px; font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s, background 0.15s;
}
.btn-sheet-cancel {
  background: #FBF3EE; color: var(--text);
  border: 1px solid var(--border);
}
.btn-sheet-cancel:hover { background: #F2E6DC; }
.btn-sheet-remove {
  background: var(--error); color: white;
  border: none;
}
.btn-sheet-remove:hover { opacity: 0.9; }

/* Sheet enter/leave transitions: backdrop fades, sheet slides up */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.22s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}
.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}
</style>
