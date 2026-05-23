<template>
  <div>
    <!-- Success -->
    <template v-if="view === 'success'">
      <header class="header"><div class="header-title">Order Placed</div></header>
      <div class="success-screen">
        <div class="success-icon">
          <svg width="36" height="36" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="success-title">Order Submitted!</div>
        <div class="success-sub">Your payment proof has been received. Our team will review and confirm your order shortly.</div>
        <div class="order-no-badge">{{ orderNo }}</div>
        <div class="success-sub" style="font-size:12px;margin-bottom:24px;">You'll be notified once your order is confirmed.</div>
        <button class="btn-primary" @click="router.push('/orders')" style="margin-top:0;">View My Orders</button>
        <button class="btn-secondary" @click="router.push('/home')" style="margin-top:10px;">Continue Shopping</button>
      </div>
    </template>

    <!-- Payment flow -->
    <template v-else>
      <header class="header">
        <button class="back-btn" @click="router.push('/cart')" aria-label="Back">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div class="header-title">Payment</div>
      </header>

      <div class="steps">
        <div class="step done"><div class="step-dot">✓</div><span>Cart</span></div>
        <div class="step-line"></div>
        <div class="step done"><div class="step-dot">✓</div><span>Details</span></div>
        <div class="step-line"></div>
        <div class="step active"><div class="step-dot">3</div><span>Payment</span></div>
      </div>

      <main class="main">
        <!-- Amount -->
        <div class="amount-card">
          <div class="amount-label">Amount to Transfer</div>
          <div class="amount-value">MYR {{ draft ? draft.total.toFixed(2) : '0.00' }}</div>
          <div class="amount-items" v-if="draft">{{ draft.items.length }} item{{ draft.items.length > 1 ? 's' : '' }} · {{ pickupLabel }}</div>
        </div>

        <!-- Bank details -->
        <div class="info-card">
          <div class="info-card-title">
            <svg width="16" height="16" fill="none" stroke="var(--primary)" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            Transfer to This Account
          </div>
          <div class="bank-detail">
            <div class="bank-name">Maybank</div>
            <div class="bank-acct">5621 4892 3710</div>
            <div class="bank-holder">Hartinna Sdn Bhd</div>
          </div>
          <div class="alert alert-info" style="margin-top:12px;margin-bottom:0;">
            Please transfer the exact amount shown above. Screenshot or save your receipt — you'll need to upload it below.
          </div>
        </div>

        <div class="divider"></div>

        <div class="section-label">Upload Transfer Proof</div>
        <div v-if="alertMsg" :class="['alert', 'alert-' + alertType]">{{ alertMsg }}</div>

        <!-- Upload area -->
        <div
          v-if="!proofFile"
          :class="['upload-area', dragOver ? 'drag-over' : '']"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop"
        >
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" @change="onFileSelect" />
          <div class="upload-icon">
            <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div class="upload-title">Tap to upload receipt</div>
          <div class="upload-hint">JPG, PNG, WEBP or PDF · Max 5 MB</div>
        </div>

        <!-- Preview -->
        <div v-else class="preview-wrap">
          <img v-if="previewUrl && !isPdf" :src="previewUrl" class="preview-img" alt="Payment proof" />
          <div v-else class="preview-pdf">
            <div class="preview-pdf-icon">
              <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <div class="preview-pdf-name">{{ proofFile.name }}</div>
              <div class="preview-pdf-size">{{ fileSizeLabel }}</div>
            </div>
          </div>
          <button class="preview-change" @click="clearFile">Change</button>
        </div>

        <!-- Progress -->
        <div v-if="uploading" style="margin-top:10px;">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">{{ uploadStatus }}</div>
          <div class="progress-wrap"><div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div></div>
        </div>

        <button class="btn-primary" @click="submitOrder" :disabled="loading || !proofFile">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? uploadStatus || 'Processing…' : 'Submit Order' }}
        </button>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { guardedSession } from '@/lib/session'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cart   = useCartStore()

const view           = ref('payment')
const draft          = ref(null)
const sessionRef     = ref(null)
const memberLevel    = ref('store_manager')
const proofFile      = ref(null)
const previewUrl     = ref(null)
const dragOver       = ref(false)
const loading        = ref(false)
const uploading      = ref(false)
const uploadProgress = ref(0)
const uploadStatus   = ref('')
const orderNo        = ref('')
const alertMsg       = ref('')
const alertType      = ref('error')

const isPdf = computed(() => proofFile.value?.type === 'application/pdf')
const fileSizeLabel = computed(() => {
  if (!proofFile.value) return ''
  const kb = proofFile.value.size / 1024
  return kb > 1024 ? `${(kb/1024).toFixed(1)} MB` : `${Math.round(kb)} KB`
})
const pickupLabel = computed(() => {
  if (!draft.value) return ''
  return draft.value.pickup === 'delivery' ? 'Delivery' : 'Self Pickup'
})

function onFileSelect(e) { const f = e.target.files[0]; if (f) handleFile(f) }
function onDrop(e) { dragOver.value = false; const f = e.dataTransfer.files[0]; if (f) handleFile(f) }
function handleFile(file) {
  alertMsg.value = ''
  if (file.size > 5 * 1024 * 1024) { alertType.value = 'error'; alertMsg.value = 'File is too large. Maximum size is 5 MB.'; return }
  proofFile.value = file
  if (!isPdf.value) {
    const reader = new FileReader()
    reader.onload = e => { previewUrl.value = e.target.result }
    reader.readAsDataURL(file)
  }
}
function clearFile() { proofFile.value = null; previewUrl.value = null }

async function compressImage(file) {
  if (isPdf.value) return file
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        const maxDim = 1600
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim }
          else       { w = Math.round(w * maxDim / h); h = maxDim }
        }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        canvas.toBlob(blob => {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        }, 'image/jpeg', 0.82)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

async function submitOrder() {
  alertMsg.value = ''
  if (!proofFile.value) { alertType.value = 'error'; alertMsg.value = 'Please upload your transfer receipt.'; return }
  if (!draft.value || draft.value.items.length === 0) { alertType.value = 'error'; alertMsg.value = 'No items in your order. Please go back.'; return }

  loading.value = true; uploading.value = true; uploadProgress.value = 0

  try {
    uploadStatus.value = 'Preparing file…'; uploadProgress.value = 10
    const fileToUpload = await compressImage(proofFile.value)

    uploadStatus.value = 'Uploading receipt…'; uploadProgress.value = 30
    const ext      = isPdf.value ? 'pdf' : 'jpg'
    const fileName = `${sessionRef.value.user.id}/${Date.now()}_proof.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-proofs').upload(fileName, fileToUpload, { contentType: fileToUpload.type })
    if (uploadError) throw new Error('Upload failed: ' + uploadError.message)
    uploadProgress.value = 55

    uploadStatus.value = 'Creating order…'
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      member_id: sessionRef.value.user.id,
      member_level_snapshot: memberLevel.value,
      status: 'pending_review',
      pickup_method: draft.value.pickup,
      delivery_name: draft.value.delivery?.name || null,
      delivery_phone: draft.value.delivery?.phone || null,
      delivery_address: draft.value.delivery?.address || null,
      remarks: draft.value.remarks || null,
      total_amount: draft.value.total,
      currency: 'MYR',
      payment_proof_url: uploadData.path,
      payment_proof_uploaded_at: new Date().toISOString()
    }).select('id, order_no').single()
    if (orderError) throw new Error('Order creation failed: ' + orderError.message)
    uploadProgress.value = 70

    uploadStatus.value = 'Saving items…'
    const orderItems = draft.value.items.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name_snapshot: item.product.name,
      product_sku_snapshot: item.product.sku,
      product_image_snapshot: item.product.image_url || null,
      unit_price_snapshot: item.product.product_prices?.[0]?.price ?? 0,
      member_level_snapshot: memberLevel.value,
      qty: item.qty,
      subtotal: (item.product.product_prices?.[0]?.price ?? 0) * item.qty
    }))
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) throw new Error('Items save failed: ' + itemsError.message)
    uploadProgress.value = 85

    uploadStatus.value = 'Reserving stock…'
    for (const item of draft.value.items) {
      const { error: holdError } = await supabase.rpc('rpc_inventory_hold', { p_product_id: item.product.id, p_order_id: order.id, p_qty: item.qty })
      if (holdError) throw new Error('Stock hold failed: ' + holdError.message)
    }
    uploadProgress.value = 100

    cart.clear()
    try { localStorage.removeItem('hpp_order_draft') } catch {}
    try { localStorage.removeItem(`hpp_orders_${sessionRef.value.user.id}`) } catch {}

    orderNo.value = order.order_no
    view.value = 'success'
  } catch (e) {
    alertType.value = 'error'; alertMsg.value = e.message || 'Something went wrong. Please try again.'
  } finally {
    loading.value = false; uploading.value = false
  }
}

onMounted(async () => {
  const session = await guardedSession()
  if (!session) { router.push('/login'); return }
  sessionRef.value = session

  const { data: m } = await supabase.from('members').select('level').eq('id', session.user.id).single()
  if (m) memberLevel.value = m.level

  try {
    const saved = localStorage.getItem('hpp_order_draft')
    if (!saved) { router.push('/cart'); return }
    draft.value = JSON.parse(saved)
  } catch { router.push('/cart') }
})
</script>

<style scoped>
.header { position:sticky;top:0;z-index:100;height:var(--header-h);background:var(--card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:12px;box-shadow:0 2px 12px rgba(44,24,16,0.06); }
.back-btn { width:36px;height:36px;background:none;border:1.5px solid var(--border);border-radius:var(--radius-xs);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-muted);flex-shrink:0;transition:border-color 0.15s,color 0.15s; }
.back-btn:hover { border-color:var(--primary);color:var(--primary); }
.header-title { font-family:var(--font-display);font-size:18px;color:var(--text); }

.steps { display:flex;align-items:center;padding:14px 16px;background:var(--card);border-bottom:1px solid var(--border); }
.step { display:flex;align-items:center;gap:6px;font-size:11px;font-weight:500;color:var(--text-muted); }
.step.done { color:var(--success); }
.step.active { color:var(--primary);font-weight:600; }
.step-dot { width:20px;height:20px;border-radius:50%;border:1.5px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0; }
.step.done .step-dot { background:var(--success);border-color:var(--success);color:white; }
.step.active .step-dot { background:var(--primary);border-color:var(--primary);color:white; }
.step-line { flex:1;height:1.5px;background:var(--border);margin:0 6px; }

.main { padding:16px 16px 100px; }

.amount-card { background:linear-gradient(135deg,var(--primary) 0%,#E0408A 100%);border-radius:var(--radius);padding:20px;text-align:center;margin-bottom:16px;box-shadow:0 6px 20px rgba(212,39,108,0.3); }
.amount-label { font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-bottom:8px; }
.amount-value { font-family:var(--font-display);font-size:36px;font-weight:600;color:white;margin-bottom:4px; }
.amount-items { font-size:12px;color:rgba(255,255,255,0.65); }

.info-card { background:var(--card);border-radius:var(--radius);border:1px solid rgba(232,216,212,0.6);padding:16px;margin-bottom:16px;box-shadow:0 2px 8px rgba(44,24,16,0.05); }
.info-card-title { font-size:13px;font-weight:600;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:8px; }
.bank-detail { background:var(--bg);border-radius:var(--radius-xs);padding:12px;margin-top:10px;border:1px dashed var(--border); }
.bank-name   { font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px; }
.bank-acct   { font-size:18px;font-weight:700;color:var(--primary);letter-spacing:0.05em; }
.bank-holder { font-size:12px;color:var(--text-muted);margin-top:2px; }

.section-label { font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px; }
.divider { height:1px;background:var(--border);margin:18px 0; }

.alert { padding:11px 14px;border-radius:var(--radius-sm);font-size:13px;margin-bottom:14px;line-height:1.5; }
.alert-error { background:#FEF0EE;color:var(--error);border:1px solid #F5C6C2; }
.alert-info  { background:#FEF8EE;color:#7A5510;border:1px solid #F5DFA2; }

.upload-area { border:2px dashed var(--border);border-radius:var(--radius);padding:28px 16px;text-align:center;cursor:pointer;transition:border-color 0.2s,background 0.2s;background:var(--card);position:relative; }
.upload-area:hover,.upload-area.drag-over { border-color:var(--primary);background:var(--primary-light); }
.upload-area input[type="file"] { position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%; }
.upload-icon  { margin-bottom:10px;color:var(--text-muted); }
.upload-title { font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px; }
.upload-hint  { font-size:12px;color:var(--text-muted); }

.preview-wrap { position:relative;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);background:var(--card); }
.preview-img  { width:100%;max-height:220px;object-fit:contain;display:block;background:#f8f4f2; }
.preview-pdf  { padding:20px 16px;display:flex;align-items:center;gap:12px; }
.preview-pdf-icon { color:var(--primary);flex-shrink:0; }
.preview-pdf-name { font-size:13px;font-weight:500;color:var(--text);word-break:break-all; }
.preview-pdf-size { font-size:11px;color:var(--text-muted);margin-top:2px; }
.preview-change { position:absolute;top:8px;right:8px;background:rgba(44,24,16,0.6);color:white;font-size:11px;font-weight:600;padding:5px 10px;border-radius:20px;cursor:pointer;border:none;backdrop-filter:blur(4px); }

.progress-wrap { background:var(--primary-light);border-radius:20px;height:6px;overflow:hidden;margin:8px 0; }
.progress-bar  { height:100%;background:linear-gradient(90deg,var(--primary),#E0408A);border-radius:20px;transition:width 0.3s ease; }

.btn-primary { width:100%;padding:15px;background:linear-gradient(135deg,var(--primary) 0%,#E0408A 100%);color:white;border:none;border-radius:var(--radius-sm);font-family:var(--font-body);font-size:15px;font-weight:600;cursor:pointer;margin-top:14px;box-shadow:0 4px 16px rgba(212,39,108,0.33);transition:opacity 0.15s,transform 0.15s;display:flex;align-items:center;justify-content:center;gap:8px; }
.btn-primary:hover:not(:disabled) { opacity:0.91;transform:translateY(-1px); }
.btn-primary:disabled { opacity:0.55;cursor:not-allowed; }
.btn-secondary { width:100%;padding:13px;background:none;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:14px;font-weight:500;color:var(--text-muted);cursor:pointer;transition:border-color 0.15s; }
.btn-secondary:hover { border-color:var(--primary);color:var(--primary); }

.spinner { width:16px;height:16px;border:2px solid rgba(255,255,255,0.35);border-top-color:white;border-radius:50%;animation:spin 0.65s linear infinite;flex-shrink:0; }

.success-screen { min-height:calc(100dvh - var(--header-h));display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center; }
.success-icon { width:72px;height:72px;background:var(--success-light);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;border:2px solid rgba(46,125,82,0.2); }
.success-title { font-family:var(--font-display);font-size:24px;color:var(--text);margin-bottom:10px; }
.success-sub   { font-size:14px;color:var(--text-muted);line-height:1.6;margin-bottom:16px;max-width:320px; }
.order-no-badge { background:var(--primary-light);color:var(--primary);font-size:14px;font-weight:700;letter-spacing:0.05em;padding:8px 20px;border-radius:20px;margin-bottom:12px; }
</style>
