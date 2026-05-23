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
      <!-- Empty -->
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
              <div>
                <div class="item-subtotal">MYR {{ itemSubtotal(item).toFixed(2) }}</div>
                <div class="item-unit-price">MYR {{ unitPrice(item).toFixed(2) }} × {{ item.qty }}</div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <div class="qty-stepper">
                  <button class="qty-btn" @click="decQty(item)" :disabled="item.qty <= 1">−</button>
                  <div class="qty-val">{{ item.qty }}</div>
                  <button class="qty-btn" @click="incQty(item)">+</button>
                </div>
                <button class="remove-btn" @click="cart.remove(item.product.id)" aria-label="Remove">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Pickup method -->
        <div class="section-label">Pickup Method</div>
        <div class="pickup-toggle">
          <div :class="['pickup-option', pickup === 'self_pickup' ? 'selected' : '']" @click="pickup = 'self_pickup'">
            <svg width="24" height="24" fill="none" :stroke="pickup === 'self_pickup' ? 'var(--primary)' : 'var(--text-muted)'" stroke-width="1.8" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span class="pickup-label">Self Pickup</span>
            <div class="pickup-desc">Collect at our location</div>
          </div>
          <div :class="['pickup-option', pickup === 'delivery' ? 'selected' : '']" @click="pickup = 'delivery'">
            <svg width="24" height="24" fill="none" :stroke="pickup === 'delivery' ? 'var(--primary)' : 'var(--text-muted)'" stroke-width="1.8" viewBox="0 0 24 24">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span class="pickup-label">Delivery</span>
            <div class="pickup-desc">Ship to my address</div>
          </div>
        </div>

        <!-- Delivery fields -->
        <template v-if="pickup === 'delivery'">
          <div class="form-group">
            <label>Recipient Name</label>
            <input v-model="delivery.name" type="text" placeholder="Full name" :class="{ err: errors.name }" />
            <div v-if="errors.name" class="field-error">{{ errors.name }}</div>
          </div>
          <div class="form-group">
            <label>Recipient Phone</label>
            <input v-model="delivery.phone" type="tel" placeholder="+60123456789" :class="{ err: errors.phone }" />
            <div v-if="errors.phone" class="field-error">{{ errors.phone }}</div>
          </div>
          <div class="form-group">
            <label>Delivery Address</label>
            <textarea v-model="delivery.address" placeholder="Full address including postcode and state" :class="{ err: errors.address }"></textarea>
            <div v-if="errors.address" class="field-error">{{ errors.address }}</div>
          </div>
        </template>

        <!-- Remarks -->
        <div class="form-group">
          <label>Remarks <span class="opt">(optional)</span></label>
          <textarea v-model="remarks" placeholder="Any special instructions or notes…" style="min-height:60px;"></textarea>
        </div>

        <div class="divider"></div>

        <!-- Summary -->
        <div class="section-label">Order Summary</div>
        <div v-if="alertMsg" class="alert alert-error">{{ alertMsg }}</div>

        <div class="summary-card">
          <div class="summary-row" v-for="item in cartList" :key="item.product.id">
            <span>{{ item.product.name }} ×{{ item.qty }}</span>
            <span>MYR {{ itemSubtotal(item).toFixed(2) }}</span>
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <span>MYR {{ grandTotal.toFixed(2) }}</span>
          </div>
        </div>

        <button class="btn-primary" @click="proceed">
          Continue to Payment
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </template>
    </main>

    <AppNav />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { guardedSession } from '@/lib/session'
import { useCartStore } from '@/stores/cart'
import AppNav from '@/components/AppNav.vue'

const router = useRouter()
const cart   = useCartStore()

const pickup  = ref('self_pickup')
const remarks = ref('')
const delivery = reactive({ name: '', phone: '', address: '' })
const errors   = reactive({})
const alertMsg = ref('')

const cartList  = computed(() => cart.cartList)
const grandTotal = computed(() => cart.grandTotal)

function unitPrice(item)    { return item.product.product_prices?.[0]?.price ?? 0 }
function itemSubtotal(item) { return unitPrice(item) * item.qty }

function incQty(item) { cart.updateQty(item.product.id, item.qty + 1) }
function decQty(item) { if (item.qty > 1) cart.updateQty(item.product.id, item.qty - 1) }

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

.section-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; }

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
.item-subtotal  { font-size: 14px; font-weight: 700; color: var(--primary); }
.item-unit-price { font-size: 11px; color: var(--text-muted); }

.qty-stepper { display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: var(--radius-xs); overflow: hidden; }
.qty-btn { width: 28px; height: 28px; background: none; border: none; cursor: pointer; font-size: 16px; color: var(--primary); display: flex; align-items: center; justify-content: center; transition: background 0.12s; flex-shrink: 0; }
.qty-btn:hover { background: var(--primary-light); }
.qty-btn:disabled { color: var(--border); cursor: not-allowed; }
.qty-val { width: 32px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text); border-left: 1px solid var(--border); border-right: 1px solid var(--border); line-height: 28px; }
.remove-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; display: flex; align-items: center; transition: color 0.15s; }
.remove-btn:hover { color: var(--error); }

.divider { height: 1px; background: var(--border); margin: 20px 0; }

.pickup-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.pickup-option { border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 12px; cursor: pointer; text-align: center; transition: border-color 0.15s, background 0.15s; background: #FDFAF8; }
.pickup-option.selected { border-color: var(--primary); background: var(--primary-light); }
.pickup-option svg { margin-bottom: 6px; }
.pickup-label { font-size: 13px; font-weight: 600; color: var(--text); display: block; }
.pickup-desc  { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.form-group { margin-bottom: 14px; }
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

.summary-card { background: var(--card); border-radius: var(--radius); border: 1px solid rgba(232,216,212,0.6); padding: 14px 16px; margin-bottom: 16px; }
.summary-row { display: flex; justify-content: space-between; font-size: 13.5px; color: var(--text-muted); margin-bottom: 8px; }
.summary-row:last-child { margin-bottom: 0; }
.summary-row.total { font-size: 15px; font-weight: 700; color: var(--text); border-top: 1px solid var(--border); padding-top: 10px; margin-top: 6px; }
.summary-row.total span:last-child { color: var(--primary); }

.btn-primary {
  width: 100%; padding: 15px;
  background: linear-gradient(135deg, var(--primary) 0%, #E0408A 100%);
  color: white; border: none; border-radius: var(--radius-sm);
  font-family: var(--font-body); font-size: 15px; font-weight: 600;
  cursor: pointer; box-shadow: 0 4px 16px rgba(212,39,108,0.33);
  transition: opacity 0.15s, transform 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-primary:hover { opacity: 0.91; transform: translateY(-1px); }
</style>
