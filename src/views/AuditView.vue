<template>
  <div>
    <div v-if="state === 'loading'" class="loading-screen"><div class="loading-spinner"></div></div>

    <template v-else>
      <header class="header">
        <button class="back-btn" @click="router.push('/profile')" aria-label="Back">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div class="header-title">Activity Log</div>
      </header>

      <div class="info-banner">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Your account actions are recorded here. Only you can see your own activity.
      </div>

      <main class="main">
        <div v-if="groups.length === 0" class="empty">
          <svg width="48" height="48" fill="none" stroke="var(--primary)" stroke-width="1.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <h3>No activity yet</h3>
          <p>Your account actions will appear here.</p>
        </div>

        <div class="log-group" v-for="group in groups" :key="group.date">
          <div class="log-date-label">{{ group.date }}</div>

          <div class="log-entry" v-for="(entry, i) in group.entries" :key="entry.id">
            <div class="log-line" v-if="i < group.entries.length - 1"></div>
            <div class="log-dot-wrap">
              <div :class="['log-dot', 'dot-' + entry.action.toLowerCase()]">
                <svg v-if="entry.action === 'INSERT'" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <svg v-else-if="entry.action === 'UPDATE'" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <svg v-else-if="entry.action === 'DELETE'" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                <svg v-else width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.49"/></svg>
              </div>
            </div>
            <div class="log-card">
              <div class="log-header">
                <div class="log-action">{{ actionLabel(entry.action, entry.table_name) }}</div>
                <div class="log-time">{{ formatTime(entry.created_at) }}</div>
              </div>
              <div class="log-table"><span class="tag">{{ tableLabel(entry.table_name) }}</span></div>
              <div class="log-diff" v-if="entry.diff && Object.keys(entry.diff).length">
                <div class="diff-field" v-for="(val, key) in entry.diff" :key="key">
                  <span class="diff-key">{{ key }}</span>:
                  <span v-if="val && val.new !== undefined">{{ truncate(String(val.old ?? '—')) }} → {{ truncate(String(val.new ?? '—')) }}</span>
                  <span v-else>{{ truncate(String(val)) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button v-if="hasMore" class="load-more" @click="loadMore" :disabled="loadingMore">
          {{ loadingMore ? 'Loading…' : 'Load older activity' }}
        </button>
        <div class="end-note" v-if="!hasMore && groups.length > 0">— End of activity log —</div>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { guardedSession } from '@/lib/session'

const router = useRouter()
const state       = ref('loading')
const logs        = ref([])
const hasMore     = ref(false)
const loadingMore = ref(false)
const page        = ref(0)
const PAGE_SIZE   = 20

const TABLE_LABELS = { members:'Account', orders:'Order', order_items:'Order Items', inventory:'Inventory', inventory_transactions:'Stock', products:'Product', product_prices:'Pricing', audit_logs:'Audit Log' }
const ACTION_LABELS = {
  members: { INSERT:'Account created', UPDATE:'Account updated', DELETE:'Account deleted', RESTORE:'Account restored' },
  orders:  { INSERT:'Order placed',    UPDATE:'Order updated',   DELETE:'Order deleted',   RESTORE:'Order restored'  },
  default: { INSERT:'Record created',  UPDATE:'Record updated',  DELETE:'Record deleted',  RESTORE:'Record restored' }
}

const groups = computed(() => {
  const map = {}
  logs.value.forEach(entry => {
    const dateKey = new Date(entry.created_at).toLocaleDateString('en-MY', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
    if (!map[dateKey]) map[dateKey] = []
    map[dateKey].push(entry)
  })
  return Object.entries(map).map(([date, entries]) => ({ date, entries }))
})

function actionLabel(action, table) { const t = ACTION_LABELS[table] || ACTION_LABELS.default; return t[action] || action }
function tableLabel(table) { return TABLE_LABELS[table] || table }
function formatTime(iso) { return new Date(iso).toLocaleTimeString('en-MY', { hour:'2-digit', minute:'2-digit' }) }
function truncate(str, max=30) { if (!str) return '—'; return str.length > max ? str.slice(0,max)+'…' : str }

async function fetchLogs(from=0) {
  const session = await guardedSession()
  if (!session) { router.push('/login'); return [] }
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, table_name, action, diff, created_at')
    .eq('actor_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (error || !data) return []
  hasMore.value = data.length === PAGE_SIZE
  return data
}

async function loadMore() {
  loadingMore.value = true
  const from = (page.value + 1) * PAGE_SIZE
  const more = await fetchLogs(from)
  logs.value = [...logs.value, ...more]
  page.value++
  loadingMore.value = false
}

onMounted(async () => {
  const session = await guardedSession()
  if (!session) { router.push('/login'); return }
  logs.value = await fetchLogs(0)
  state.value = 'ready'
})
</script>

<style scoped>
.header { position:sticky;top:0;z-index:100;height:var(--header-h);background:var(--card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:12px;box-shadow:0 2px 12px rgba(44,24,16,0.06); }
.back-btn { width:36px;height:36px;background:none;border:1.5px solid var(--border);border-radius:var(--radius-xs);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-muted);flex-shrink:0;transition:border-color 0.15s,color 0.15s; }
.back-btn:hover { border-color:var(--primary);color:var(--primary); }
.header-title { font-family:var(--font-display);font-size:18px;color:var(--text);flex:1; }

.info-banner { background:var(--primary-light);border-bottom:1px solid var(--border);padding:10px 16px;display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--primary);line-height:1.5; }

.main { padding:14px 16px 24px; }
.empty { text-align:center;padding:60px 24px;color:var(--text-muted); }
.empty svg { opacity:0.2;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto; }
.empty h3  { font-family:var(--font-display);font-size:18px;color:var(--text);margin-bottom:8px; }
.empty p   { font-size:13.5px; }

.log-group { margin-bottom:20px; }
.log-date-label { font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;padding-left:4px; }
.log-entry { display:flex;gap:12px;margin-bottom:2px;position:relative; }
.log-entry:not(:last-child) .log-line { position:absolute;left:15px;top:30px;bottom:-2px;width:1.5px;background:var(--border); }
.log-dot-wrap { flex-shrink:0;display:flex;flex-direction:column;align-items:center; }
.log-dot { width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.log-card { flex:1;background:var(--card);border-radius:var(--radius-sm);border:1px solid rgba(232,216,212,0.6);padding:11px 14px;margin-bottom:8px;box-shadow:0 1px 6px rgba(44,24,16,0.05); }
.log-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px; }
.log-action { font-size:13px;font-weight:600;color:var(--text); }
.log-time   { font-size:11px;color:var(--text-muted);white-space:nowrap;margin-left:8px; }
.log-table  { font-size:11.5px;color:var(--text-muted);margin-bottom:6px; }
.log-table .tag { display:inline-block;background:var(--bg);border:1px solid var(--border);padding:1px 7px;border-radius:10px;font-size:10.5px;color:var(--text-muted); }
.log-diff { background:var(--bg);border-radius:var(--radius-xs);padding:8px 10px;font-size:11.5px;color:var(--text-muted);margin-top:6px; }
.diff-field { margin-bottom:3px; }
.diff-field:last-child { margin-bottom:0; }
.diff-key { color:var(--primary);font-weight:600; }
.dot-insert  { background:#D5F5E3;color:#2E7D52; }
.dot-update  { background:#D6EAF8;color:#154360; }
.dot-delete  { background:#FEF0EE;color:#C0392B; }
.dot-restore { background:#E8DAEF;color:#512E5F; }

.load-more { width:100%;padding:12px;background:none;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:13.5px;font-weight:500;color:var(--text-muted);cursor:pointer;margin-top:8px;transition:border-color 0.15s,color 0.15s; }
.load-more:hover { border-color:var(--primary);color:var(--primary); }
.load-more:disabled { opacity:0.5;cursor:not-allowed; }
.end-note { text-align:center;font-size:12px;color:var(--text-muted);padding:16px 0 4px; }
</style>
