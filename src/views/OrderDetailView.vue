<template>
  <div>
    <div v-if="state === 'loading'" class="loading-screen"><div class="loading-spinner"></div></div>

    <div v-else-if="state === 'error'" class="loading-screen" style="flex-direction:column;gap:12px;padding:32px;text-align:center;">
      <div style="font-size:32px;">😕</div>
      <div style="font-family:var(--font-display);font-size:18px;color:var(--text);">Order not found</div>
      <button @click="router.push('/orders')" style="margin-top:8px;padding:11px 24px;border:1.5px solid var(--primary);border-radius:var(--radius-sm);color:var(--primary);background:none;font-size:14px;font-weight:600;cursor:pointer;">Back to Orders</button>
    </div>

    <template v-else-if="order">
      <header class="header">
        <button class="back-btn" @click="router.push('/orders')" aria-label="Back">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div class="header-info">
          <div class="header-title">{{ order.order_no }}</div>
          <div class="header-sub">{{ formatDate(order.created_at) }}</div>
        </div>
      </header>

      <main class="main">
        <!-- Status banner -->
        <div :class="['status-banner', 'banner-' + order.status]">
          <div class="status-icon">
            <svg v-if="order.status === 'pending_review'" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <svg v-else-if="order.status === 'confirmed'" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <svg v-else-if="order.status === 'preparing'" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 8h14M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-9 4h4"/></svg>
            <svg v-else-if="order.status === 'completed'" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div class="status-text">
            <div class="status-name">{{ statusLabel(order.status) }}</div>
            <div class="status-desc">{{ statusDesc(order.status) }}</div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="timeline" v-if="order.status !== 'cancelled'">
          <div class="timeline-steps">
            <div class="tl-step" v-for="(step, i) in TIMELINE" :key="step.key">
              <div :class="['tl-dot', stepState(i)]">
                <span v-if="stepState(i) === 'done'">✓</span>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <div :class="['tl-label', stepState(i)]">{{ step.label }}</div>
              <div v-if="i < TIMELINE.length - 1" :class="['tl-line', stepState(i) === 'done' ? 'done' : '']"></div>
            </div>
          </div>
        </div>

        <!-- Order info -->
        <div class="info-card">
          <div class="card-label">Order Info</div>
          <div class="info-row"><span class="label">Order No.</span><span class="value">{{ order.order_no }}</span></div>
          <div class="info-row"><span class="label">Date</span><span class="value">{{ formatDate(order.created_at) }}</span></div>
          <div class="info-row"><span class="label">Pickup</span><span class="value">{{ order.pickup_method === 'delivery' ? 'Delivery' : 'Self Pickup' }}</span></div>
          <template v-if="order.pickup_method === 'delivery'">
            <div class="info-row" v-if="order.delivery_name"><span class="label">Recipient</span><span class="value">{{ order.delivery_name }}</span></div>
            <div class="info-row" v-if="order.delivery_phone"><span class="label">Phone</span><span class="value">{{ order.delivery_phone }}</span></div>
            <div class="info-row" v-if="order.delivery_address"><span class="label">Address</span><span class="value" style="max-width:60%;text-align:right;">{{ order.delivery_address }}</span></div>
          </template>
          <div class="info-row" v-if="order.remarks"><span class="label">Remarks</span><span class="value" style="max-width:60%;text-align:right;">{{ order.remarks }}</span></div>
        </div>

        <!-- Items -->
        <div class="info-card">
          <div class="card-label">Items</div>
          <div class="order-item" v-for="item in order.order_items" :key="item.id">
            <div class="item-img">
              <img v-if="item.product_image_snapshot" :src="item.product_image_snapshot" :alt="item.product_name_snapshot" />
              <span v-else>{{ item.product_name_snapshot[0] }}</span>
            </div>
            <div class="item-details">
              <div class="item-name">{{ item.product_name_snapshot }}</div>
              <div class="item-sku">{{ item.product_sku_snapshot }}</div>
            </div>
            <div class="item-price-col">
              <div class="item-qty">×{{ item.qty }} @ MYR {{ Number(item.unit_price_snapshot).toFixed(2) }}</div>
              <div class="item-subtotal">MYR {{ Number(item.subtotal).toFixed(2) }}</div>
            </div>
          </div>
          <div class="total-row">
            <span class="total-label">Total</span>
            <span class="total-value">MYR {{ Number(order.total_amount).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Cancel button -->
        <div class="cancel-section" v-if="order.status === 'pending_review'">
          <button class="btn-cancel" @click="showCancel = true" :disabled="cancelling">Cancel Order</button>
        </div>
      </main>

      <!-- Cancel dialog -->
      <Transition name="fade">
        <div class="dialog-overlay" v-if="showCancel" @click.self="showCancel = false">
          <div class="dialog">
            <div class="dialog-title">Cancel this order?</div>
            <div class="dialog-desc">This will release your reserved stock. This action cannot be undone.</div>
            <div class="dialog-btns">
              <button class="btn-keep" @click="showCancel = false">Keep Order</button>
              <button class="btn-confirm-cancel" @click="cancelOrder" :disabled="cancelling">
                <span v-if="cancelling" class="spinner"></span>
                {{ cancelling ? 'Cancelling…' : 'Yes, Cancel' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const route  = useRoute()
const state      = ref('loading')
const order      = ref(null)
const showCancel = ref(false)
const cancelling = ref(false)

const STATUS_LABELS = { pending_review:'Pending Review', confirmed:'Confirmed', preparing:'Preparing', completed:'Completed', cancelled:'Cancelled' }
const STATUS_DESCS  = { pending_review:'Waiting for our team to verify your payment.', confirmed:'Your payment has been verified. Order confirmed!', preparing:'Your order is being packed and prepared.', completed:'Order delivered or collected. Thank you!', cancelled:'This order has been cancelled.' }
const TIMELINE = [ { key:'pending_review', label:'Pending' }, { key:'confirmed', label:'Confirmed' }, { key:'preparing', label:'Preparing' }, { key:'completed', label:'Completed' } ]
const ORDER_INDEX = { pending_review:0, confirmed:1, preparing:2, completed:3 }

function statusLabel(s) { return STATUS_LABELS[s] || s }
function statusDesc(s)  { return STATUS_DESCS[s]  || '' }

function stepState(i) {
  if (!order.value) return ''
  const current = ORDER_INDEX[order.value.status] ?? -1
  if (i < current) return 'done'
  if (i === current) return 'active'
  return ''
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

async function cancelOrder() {
  cancelling.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('orders')
      .update({ status:'cancelled', cancelled_at: new Date().toISOString(), cancel_by:'member', cancel_reason:'Cancelled by member' })
      .eq('id', order.value.id).eq('member_id', session.user.id)
    if (error) throw error

    for (const item of order.value.order_items) {
      await supabase.rpc('rpc_inventory_release', { p_product_id: item.product_id, p_order_id: order.value.id, p_qty: item.qty, p_from_stage: 'hold' })
    }
    order.value.status = 'cancelled'
    order.value.cancelled_at = new Date().toISOString()
    showCancel.value = false
    try { localStorage.removeItem(`hpp_orders_${session.user.id}`) } catch {}
  } catch (e) {
    alert('Failed to cancel: ' + (e.message || 'Unknown error'))
  } finally {
    cancelling.value = false
  }
}

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { router.push('/login'); return }

  const orderId = route.params.id
  if (!orderId) { state.value = 'error'; return }

  const { data, error } = await supabase.from('orders')
    .select('id,order_no,status,total_amount,currency,pickup_method,delivery_name,delivery_phone,delivery_address,remarks,created_at,payment_proof_url,payment_proof_uploaded_at,cancelled_at,cancel_reason,order_items(id,product_id,product_name_snapshot,product_sku_snapshot,product_image_snapshot,unit_price_snapshot,qty,subtotal)')
    .eq('id', orderId).eq('member_id', session.user.id).single()

  if (error || !data) { state.value = 'error'; return }
  order.value = data
  state.value = 'ready'
})
</script>

<style scoped>
.header { position:sticky;top:0;z-index:100;height:var(--header-h);background:var(--card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:12px;box-shadow:0 2px 12px rgba(44,24,16,0.06); }
.back-btn { width:36px;height:36px;background:none;border:1.5px solid var(--border);border-radius:var(--radius-xs);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-muted);flex-shrink:0;transition:border-color 0.15s,color 0.15s; }
.back-btn:hover { border-color:var(--primary);color:var(--primary); }
.header-info { flex:1;min-width:0; }
.header-title { font-family:var(--font-display);font-size:16px;color:var(--text); }
.header-sub   { font-size:11px;color:var(--text-muted);margin-top:1px; }

.main { padding:14px 16px 100px; }

.status-banner { border-radius:var(--radius);padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;gap:12px; }
.status-icon { width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.status-text { flex:1; }
.status-name { font-size:14px;font-weight:600; }
.status-desc { font-size:12px;opacity:0.75;margin-top:2px; }
.banner-pending_review { background:#FEF3CD;color:#7A5510; } .banner-pending_review .status-icon { background:rgba(240,165,0,0.15); }
.banner-confirmed { background:#D6EAF8;color:#154360; } .banner-confirmed .status-icon { background:rgba(46,134,193,0.15); }
.banner-preparing { background:#E8DAEF;color:#512E5F; } .banner-preparing .status-icon { background:rgba(142,68,173,0.15); }
.banner-completed { background:#D5F5E3;color:#145A32; } .banner-completed .status-icon { background:rgba(39,174,96,0.15); }
.banner-cancelled { background:#F2F3F4;color:#566573; } .banner-cancelled .status-icon { background:rgba(149,165,166,0.15); }

.timeline { background:var(--card);border-radius:var(--radius);border:1px solid rgba(232,216,212,0.6);padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(44,24,16,0.05); }
.timeline-steps { display:flex;align-items:flex-start;position:relative; }
.tl-step { flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;position:relative; }
.tl-dot { width:24px;height:24px;border-radius:50%;border:2px solid var(--border);background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--text-muted);position:relative;z-index:1;transition:all 0.2s; }
.tl-dot.done   { background:var(--primary);border-color:var(--primary);color:white; }
.tl-dot.active { background:white;border-color:var(--primary);color:var(--primary);box-shadow:0 0 0 4px var(--primary-light); }
.tl-label { font-size:10px;font-weight:500;color:var(--text-muted);text-align:center;line-height:1.3; }
.tl-label.active { color:var(--primary);font-weight:600; }
.tl-label.done   { color:var(--text); }
.tl-line { position:absolute;top:11px;left:calc(50% + 12px);right:calc(-50% + 12px);height:2px;background:var(--border);z-index:0; }
.tl-line.done { background:var(--primary); }

.info-card { background:var(--card);border-radius:var(--radius);border:1px solid rgba(232,216,212,0.6);padding:14px 16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(44,24,16,0.05); }
.card-label { font-size:12px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px; }
.info-row { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;font-size:13.5px; }
.info-row:last-child { margin-bottom:0; }
.info-row .label { color:var(--text-muted);flex-shrink:0;margin-right:12px; }
.info-row .value { color:var(--text);font-weight:500; }

.order-item { display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border); }
.order-item:last-child { border-bottom:none;padding-bottom:0; }
.item-img { width:44px;height:44px;border-radius:var(--radius-xs);background:linear-gradient(135deg,#FDF0F2,#FBF3EE);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-display);font-size:16px;color:var(--primary);overflow:hidden; }
.item-img img { width:100%;height:100%;object-fit:cover; }
.item-details { flex:1;min-width:0; }
.item-name { font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.item-sku  { font-size:11px;color:var(--text-muted); }
.item-price-col { text-align:right;flex-shrink:0; }
.item-qty      { font-size:11.5px;color:var(--text-muted); }
.item-subtotal { font-size:13.5px;font-weight:700;color:var(--primary);margin-top:2px; }
.total-row { display:flex;justify-content:space-between;align-items:center;padding-top:12px;margin-top:4px;border-top:1.5px solid var(--border); }
.total-label { font-size:14px;font-weight:600;color:var(--text); }
.total-value { font-size:18px;font-weight:700;color:var(--primary); }

.cancel-section { margin-top:6px; }
.btn-cancel { width:100%;padding:13px;background:none;border:1.5px solid var(--error);border-radius:var(--radius-sm);color:var(--error);font-family:var(--font-body);font-size:14px;font-weight:600;cursor:pointer;transition:background 0.15s; }
.btn-cancel:hover { background:var(--error-light); }
.btn-cancel:disabled { opacity:0.5;cursor:not-allowed; }

.dialog-overlay { position:fixed;inset:0;background:rgba(44,24,16,0.45);display:flex;align-items:flex-end;z-index:200; }
.dialog { background:var(--card);border-radius:var(--radius) var(--radius) 0 0;padding:24px 20px 32px;width:100%;max-width:480px;margin:0 auto;box-shadow:0 -8px 32px rgba(44,24,16,0.15); }
.dialog-title { font-family:var(--font-display);font-size:18px;color:var(--text);margin-bottom:8px; }
.dialog-desc  { font-size:13.5px;color:var(--text-muted);margin-bottom:20px;line-height:1.5; }
.dialog-btns { display:flex;gap:10px; }
.dialog-btns button { flex:1;padding:13px;border-radius:var(--radius-sm);font-family:var(--font-body);font-size:14px;font-weight:600;cursor:pointer; }
.btn-keep           { background:none;border:1.5px solid var(--border);color:var(--text-muted); }
.btn-confirm-cancel { background:var(--error);border:none;color:white;display:flex;align-items:center;justify-content:center;gap:6px; }
.btn-confirm-cancel:disabled { opacity:0.6;cursor:not-allowed; }
.spinner { width:14px;height:14px;border:2px solid rgba(255,255,255,0.35);border-top-color:white;border-radius:50%;animation:spin 0.65s linear infinite; }

.fade-enter-active, .fade-leave-active { transition:opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity:0; }
</style>
