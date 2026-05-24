<template>
  <div>
    <!-- Skeleton -->
    <div v-if="state === 'loading'" class="sk-screen">
      <div class="sk-header">
        <div class="sk" style="width:36px;height:36px;border-radius:10px;"></div>
        <div class="sk" style="width:110px;height:20px;"></div>
      </div>
      <div class="sk-tabs">
        <div class="sk" style="width:36px;height:28px;border-radius:20px;" v-for="i in 5" :key="i"></div>
      </div>
      <div class="sk-main">
        <div v-for="i in 4" :key="i" style="background:#fff;border-radius:14px;border:1px solid var(--border);padding:14px 16px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <div><div class="sk" style="width:100px;height:14px;margin-bottom:6px;"></div><div class="sk" style="width:80px;height:11px;"></div></div>
            <div class="sk" style="width:80px;height:24px;border-radius:20px;"></div>
          </div>
          <div style="display:flex;gap:6px;margin-bottom:10px;">
            <div class="sk" style="width:80px;height:22px;border-radius:20px;"></div>
            <div class="sk" style="width:60px;height:22px;border-radius:20px;"></div>
          </div>
          <div style="border-top:1px solid var(--border);padding-top:10px;display:flex;justify-content:space-between;">
            <div class="sk" style="width:80px;height:18px;"></div>
            <div class="sk" style="width:16px;height:16px;border-radius:50%;"></div>
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <header class="header">
        <div class="header-brand">
          <svg viewBox="0 0 30 30" fill="none"><rect x="4" y="4" width="5" height="22" rx="2.5" fill="white"/><rect x="21" y="4" width="5" height="22" rx="2.5" fill="white"/><rect x="4" y="12.5" width="22" height="5" rx="2.5" fill="white" opacity="0.85"/></svg>
        </div>
        <div class="header-title">My Orders</div>
      </header>

      <div class="filter-tabs">
        <button
          v-for="tab in tabs" :key="tab.value"
          :class="['tab', filter === tab.value ? 'active' : '']"
          @click="filter = tab.value"
        >{{ tab.label }}</button>
      </div>

      <main class="main">
        <div v-if="filteredOrders.length === 0" class="empty">
          <svg width="52" height="52" fill="none" stroke="var(--primary)" stroke-width="1.5" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <h3>No orders yet</h3>
          <p v-if="filter === 'all'">Your orders will appear here once you place one.</p>
          <p v-else>No orders with this status.</p>
          <button class="btn-outline" @click="router.push('/home')" v-if="filter === 'all'">Browse Products</button>
        </div>

        <div
          v-for="order in filteredOrders" :key="order.id"
          class="order-card"
          @click="router.push('/orders/' + order.id)"
        >
          <div class="order-top">
            <div>
              <div class="order-no">{{ order.order_no }}</div>
              <div class="order-date">{{ formatDate(order.created_at) }}</div>
            </div>
            <div :class="['status-badge', 'status-' + order.status]">
              <span class="status-dot"></span>
              {{ statusLabel(order.status) }}
            </div>
          </div>
          <div class="order-mid">
            <span class="order-tag">{{ pickupLabel(order.pickup_method) }}</span>
            <span class="order-tag">{{ order.item_count }} item{{ order.item_count > 1 ? 's' : '' }}</span>
          </div>
          <div class="order-bottom">
            <div class="order-total">MYR {{ Number(order.total_amount).toFixed(2) }}</div>
            <div class="order-chevron">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
        </div>
      </main>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { guardedSession } from '@/lib/session'
import { hppGetCache, hppSetCache } from '@/lib/cache'
const router = useRouter()
const state  = ref('loading')
const orders = ref([])
const filter = ref('all')

const STATUS_LABELS = { pending_review:'Pending Review', confirmed:'Confirmed', preparing:'Preparing', completed:'Completed', cancelled:'Cancelled' }

const tabs = [
  { value:'all', label:'All' },
  { value:'pending_review', label:'Pending' },
  { value:'confirmed', label:'Confirmed' },
  { value:'preparing', label:'Preparing' },
  { value:'completed', label:'Completed' },
  { value:'cancelled', label:'Cancelled' }
]

const filteredOrders = computed(() =>
  filter.value === 'all' ? orders.value : orders.value.filter(o => o.status === filter.value)
)

function statusLabel(s) { return STATUS_LABELS[s] || s }
function pickupLabel(m) { return m === 'delivery' ? '🚚 Delivery' : '🏠 Self Pickup' }
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-MY', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

onMounted(async () => {
  const session = await guardedSession()
  if (!session) { router.push('/login'); return }

  const uid    = session.user.id
  const CKEY   = `hpp_orders_${uid}`
  const cached = hppGetCache(CKEY)
  if (cached) { orders.value = cached; state.value = 'ready' }

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_no, status, total_amount, currency, pickup_method, created_at, order_items(id)')
    .eq('member_id', uid)
    .order('created_at', { ascending: false })

  if (!error && data) {
    const fresh = data.map(o => ({ ...o, item_count: o.order_items?.length ?? 0 }))
    orders.value = fresh
    hppSetCache(CKEY, fresh)
  }
  if (!cached) state.value = 'ready'
})
</script>

<style scoped>
.header {
  position: sticky; top: 0; z-index: 100; height: var(--header-h);
  background: var(--card); border-bottom: 1px solid var(--border);
  display: flex; align-items: center; padding: 0 16px; gap: 12px;
  box-shadow: 0 2px 12px rgba(44,24,16,0.06); animation: reveal 0.28s ease both;
}
.header-brand { width:36px;height:36px;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.header-brand svg { width:18px;height:18px; }
.header-title { flex:1;font-family:var(--font-display);font-size:19px;color:var(--text); }

.filter-tabs {
  display:flex;gap:6px;padding:12px 16px;overflow-x:auto;
  background:var(--card);border-bottom:1px solid var(--border);
  -webkit-overflow-scrolling:touch;scrollbar-width:none;
  animation: reveal 0.30s ease both 0.05s;
}
.filter-tabs::-webkit-scrollbar { display:none; }
.tab {
  flex-shrink:0;padding:6px 14px;border-radius:20px;
  font-size:12.5px;font-weight:500;cursor:pointer;
  border:1.5px solid var(--border);background:none;
  font-family:var(--font-body);color:var(--text-muted);
  transition:all 0.15s;white-space:nowrap;
}
.tab.active { background:var(--primary);border-color:var(--primary);color:white; }

.main { padding:14px 16px 120px; animation: reveal 0.32s ease both 0.07s; }

.empty { text-align:center;padding:60px 24px;color:var(--text-muted); }
.empty svg { opacity:0.2;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto; }
.empty h3  { font-family:var(--font-display);font-size:18px;color:var(--text);margin-bottom:8px; }
.empty p   { font-size:13.5px;margin-bottom:20px; }
.btn-outline { display:inline-block;padding:11px 24px;border:1.5px solid var(--primary);border-radius:var(--radius-sm);color:var(--primary);font-family:var(--font-body);font-size:14px;font-weight:600;cursor:pointer;background:none; }

.order-card { background:var(--card);border-radius:var(--radius);border:1px solid rgba(232,216,212,0.6);padding:14px 16px;margin-bottom:10px;box-shadow:0 2px 8px rgba(44,24,16,0.05);cursor:pointer;transition:transform 0.12s,box-shadow 0.12s; }
.order-card:active { transform:scale(0.99); }
.order-card:hover  { box-shadow:0 4px 16px rgba(44,24,16,0.1); }
.order-top { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px; }
.order-no   { font-size:13px;font-weight:700;color:var(--text);letter-spacing:0.02em; }
.order-date { font-size:11.5px;color:var(--text-muted);margin-top:2px; }
.status-badge { display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;white-space:nowrap;flex-shrink:0; }
.status-dot { width:6px;height:6px;border-radius:50%; }
.status-pending_review { background:#FEF3CD;color:#7A5510; } .status-pending_review .status-dot { background:#F0A500; }
.status-confirmed { background:#D6EAF8;color:#154360; } .status-confirmed .status-dot { background:#2E86C1; }
.status-preparing { background:#E8DAEF;color:#512E5F; } .status-preparing .status-dot { background:#8E44AD; }
.status-completed { background:#D5F5E3;color:#145A32; } .status-completed .status-dot { background:#27AE60; }
.status-cancelled { background:#F2F3F4;color:#566573; } .status-cancelled .status-dot { background:#95A5A6; }
.order-mid { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px; }
.order-tag { font-size:11px;color:var(--text-muted);background:var(--bg);padding:3px 9px;border-radius:20px;border:1px solid var(--border); }
.order-bottom { display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:10px; }
.order-total { font-size:15px;font-weight:700;color:var(--primary); }
.order-chevron { color:var(--text-muted);display:flex;align-items:center; }
</style>
