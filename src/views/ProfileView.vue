<template>
  <div>
    <!-- Skeleton -->
    <div v-if="state === 'loading'" class="sk-screen">
      <div class="sk-header">
        <div class="sk" style="flex:1;height:20px;max-width:120px;"></div>
      </div>
      <div style="background:linear-gradient(135deg,#f0c0d8,#d4276c);padding:32px 16px 28px;display:flex;flex-direction:column;align-items:center;gap:10px;">
        <div class="sk" style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.3);animation:none;"></div>
        <div class="sk" style="width:130px;height:18px;background:rgba(255,255,255,0.35);animation:none;"></div>
        <div class="sk" style="width:100px;height:28px;border-radius:20px;background:rgba(255,255,255,0.25);animation:none;"></div>
      </div>
      <div class="sk-main">
        <div class="sk" style="width:100px;height:11px;margin-bottom:14px;"></div>
        <div style="background:#fff;border-radius:14px;border:1px solid var(--border);overflow:hidden;">
          <div v-for="i in 4" :key="i" style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);">
            <div class="sk" style="width:36px;height:36px;border-radius:10px;"></div>
            <div><div class="sk" style="width:60px;height:11px;margin-bottom:5px;"></div><div class="sk" style="width:130px;height:14px;"></div></div>
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <header class="header"><div class="header-title">My Profile</div></header>

      <main class="main">
        <!-- Hero -->
        <div class="hero">
          <div class="avatar-wrap">
            <div class="avatar">
              <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" @error="avatarUrl = null" />
              <span v-else>{{ member.full_name ? member.full_name[0].toUpperCase() : '?' }}</span>
            </div>
            <label class="avatar-upload" title="Change photo">
              <input type="file" class="avatar-input" accept="image/jpeg,image/png,image/webp" @change="uploadAvatar" />
              <svg width="12" height="12" fill="none" stroke="var(--primary)" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </label>
          </div>
          <div class="hero-name">{{ member.full_name || '—' }}</div>
          <div class="level-badge">⭐ {{ levelLabel }}</div>
          <div class="stats-row">
            <div class="stat-item"><div class="stat-value">{{ stats.total }}</div><div class="stat-label">Orders</div></div>
            <div class="stat-item"><div class="stat-value">{{ stats.completed }}</div><div class="stat-label">Completed</div></div>
            <div class="stat-item"><div class="stat-value">MYR {{ stats.spent }}</div><div class="stat-label">Total Spent</div></div>
          </div>
        </div>

        <!-- Account info -->
        <div class="section" style="margin-top:16px;">
          <div class="section-label">Account Info</div>
          <div class="info-card">
            <div class="info-row">
              <div class="info-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
              <div class="info-content"><div class="info-label">Full Name</div><div class="info-value">{{ member.full_name || '—' }}</div></div>
            </div>
            <div class="info-row">
              <div class="info-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.63a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 18z"/></svg></div>
              <div class="info-content"><div class="info-label">Phone</div><div class="info-value">{{ member.phone || '—' }}</div></div>
            </div>
            <div class="info-row">
              <div class="info-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
              <div class="info-content"><div class="info-label">Email</div><div class="info-value">{{ email }}</div></div>
            </div>
            <div class="info-row">
              <div class="info-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
              <div class="info-content"><div class="info-label">Region</div><div class="info-value">{{ member.region || '—' }}</div></div>
            </div>
            <div class="info-row" style="border-bottom:none;">
              <div class="info-icon" style="background:#FEF3CD;color:#7A5510;"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
              <div class="info-content"><div class="info-label">Member Level</div><div class="info-value" style="color:var(--primary);">{{ levelLabel }}</div></div>
            </div>
          </div>
        </div>

        <!-- Change password -->
        <div class="section">
          <div class="section-label">Change Password</div>
          <div class="info-card" style="padding:16px;">
            <div v-if="pwAlert.msg" :class="['alert', 'alert-' + pwAlert.type]">{{ pwAlert.msg }}</div>
            <form @submit.prevent="changePassword">
              <!-- Hidden username field — required for browser password manager
                   to associate the new password with the correct account -->
              <input
                id="profile-username-hint"
                name="username"
                type="text"
                autocomplete="username"
                :value="member?.email || member?.username"
                readonly
                style="position:absolute;opacity:0;pointer-events:none;width:0;height:0;"
              />
              <div class="form-group">
                <label for="profile-new-password">New Password</label>
                <div class="input-wrap">
                   <input id="profile-new-password" name="new-password" autocomplete="new-password" v-model="pw.new" :type="showPw ? 'text' : 'password'" placeholder="Min. 6 characters" />
                  <button class="pass-toggle" @click="showPw = !showPw" type="button">
                    <svg v-if="!showPw" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
              </div>
              <div class="form-group" style="margin-bottom:14px;">
                <label for="profile-confirm-password">Confirm Password</label>
                <input id="profile-confirm-password" name="confirm-password" autocomplete="new-password" v-model="pw.confirm" :type="showPw ? 'text' : 'password'" placeholder="Repeat password" />
              </div>
              <button class="btn-primary" type="submit" :disabled="pwLoading">
                <span v-if="pwLoading" class="spinner"></span>
                {{ pwLoading ? 'Updating…' : 'Update Password' }}
              </button>
            </form>
          </div>
        </div>

        <!-- Menu -->
        <div class="section">
          <div class="section-label">More</div>
          <div class="menu-card">
            <button class="menu-item" @click="router.push('/orders')">
              <div class="menu-icon ic-orders"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
              <div class="menu-text"><div class="menu-label">My Orders</div><div class="menu-desc">View order history and status</div></div>
              <svg class="menu-chevron" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button class="menu-item" @click="router.push('/audit')">
              <div class="menu-icon ic-audit"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
              <div class="menu-text"><div class="menu-label">Activity Log</div><div class="menu-desc">View your account activity</div></div>
              <svg class="menu-chevron" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button v-if="canShowInstall" class="menu-item" @click="installBanner?.open()">
              <div class="menu-icon ic-install"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="15" x2="12" y2="8"/><polyline points="9 12 12 15 15 12"/></svg></div>
              <div class="menu-text"><div class="menu-label">Add to Home Screen</div><div class="menu-desc">Install app for faster access</div></div>
              <svg class="menu-chevron" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button class="menu-item" @click="showSignOut = true">
              <div class="menu-icon ic-logout"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div>
              <div class="menu-text"><div class="menu-label" style="color:var(--error);">Sign Out</div></div>
            </button>
          </div>
        </div>
      </main>
    </template>

    <!-- Sign out dialog -->
    <Transition name="fade">
      <div class="dialog-overlay" v-if="showSignOut" @click.self="showSignOut = false">
        <div class="dialog">
          <div class="dialog-title">Sign out?</div>
          <div class="dialog-desc">You'll need to sign in again to access your account.</div>
          <div class="dialog-btns">
            <button class="btn-keep" @click="showSignOut = false">Cancel</button>
            <button class="btn-signout" @click="signOut">Sign Out</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Install banner (force mode — triggered by menu item) -->
    <InstallBanner ref="installBanner" :force="true" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { guardedSession } from '@/lib/session'
import { hppGetCache, hppSetCache } from '@/lib/cache'
import InstallBanner from '@/components/InstallBanner.vue'
import { useInstallPrompt } from '@/composables/useInstallPrompt'
const router = useRouter()
const { canInstall, showIosPrompt, isInstalled } = useInstallPrompt()
const installBanner = ref(null)
const canShowInstall = computed(() => !isInstalled && (canInstall.value || showIosPrompt))
const state       = ref('loading')
const member      = reactive({ full_name:'', phone:'', region:'', level:'' })
const email       = ref('')
const avatarUrl   = ref(null)
const showSignOut = ref(false)
const showPw      = ref(false)
const pwLoading   = ref(false)
const pw          = reactive({ new:'', confirm:'' })
const pwAlert     = reactive({ type:'error', msg:'' })
const stats       = reactive({ total:0, completed:0, spent:'0' })

const LEVEL_LABELS = { store_manager:'Store Manager', director:'Director', ceo:'CEO', branch:'Branch', exec_shareholder:'Exec. Shareholder' }
const levelLabel = computed(() => LEVEL_LABELS[member.level] || member.level)

async function uploadAvatar(e) {
  const file = e.target.files[0]; if (!file) return
  const compressed = await new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height; const max = 400
        if (w > max || h > max) { if (w > h) { h = Math.round(h*max/w); w=max } else { w = Math.round(w*max/h); h=max } }
        canvas.width=w; canvas.height=h
        canvas.getContext('2d').drawImage(img,0,0,w,h)
        canvas.toBlob(blob => resolve(new File([blob],'avatar.jpg',{type:'image/jpeg'})),'image/jpeg',0.85)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
  const { data:{session} } = await supabase.auth.getSession()
  const path = `${session.user.id}/avatar.jpg`
  const { error } = await supabase.storage.from('member-avatars').upload(path, compressed, { upsert:true, contentType:'image/jpeg' })
  if (!error) {
    const { data } = supabase.storage.from('member-avatars').getPublicUrl(path)
    avatarUrl.value = data.publicUrl + '?t=' + Date.now()
    // Mark flag so future loads skip the storage probe
    await supabase.from('members').update({ has_avatar: true }).eq('id', session.user.id)
  }
}

async function changePassword() {
  pwAlert.msg = ''
  if (pw.new.length < 6)     { pwAlert.type='error'; pwAlert.msg='Password must be at least 6 characters.'; return }
  if (pw.new !== pw.confirm)  { pwAlert.type='error'; pwAlert.msg='Passwords do not match.'; return }
  pwLoading.value = true
  const { error } = await supabase.auth.updateUser({ password: pw.new })
  pwLoading.value = false
  if (error) { pwAlert.type='error'; pwAlert.msg=error.message }
  else { pwAlert.type='success'; pwAlert.msg='Password updated successfully.'; pw.new=''; pw.confirm='' }
}

async function signOut() {
  try { localStorage.setItem('hpp_last_email', email.value); localStorage.removeItem('hpp_keep_until'); localStorage.removeItem('hpp_keep_pref') } catch {}
  await supabase.auth.signOut()
  router.push('/login')
}

onMounted(async () => {
  const session = await guardedSession()
  if (!session) { router.push('/login'); return }
  const uid = session.user.id
  email.value = session.user.email

  const CKEY = `hpp_profile_${uid}`; const cached = hppGetCache(CKEY)
  if (cached) {
    if (cached.member) { member.full_name=cached.member.full_name; member.phone=cached.member.phone; member.region=cached.member.region; member.level=cached.member.level }
    if (cached.stats)  { stats.total=cached.stats.total; stats.completed=cached.stats.completed; stats.spent=cached.stats.spent }
    state.value = 'ready'
  }

  // Only attempt to load avatar when the flag is set — avoids 400 console
  // noise from probing storage for members who never uploaded a photo.

  const [{ data:m }, { data:orderData }] = await Promise.all([
    supabase.from('members').select('full_name,phone,region,level,has_avatar').eq('id',uid).single(),
    supabase.from('orders').select('status,total_amount').eq('member_id',uid).neq('status','cancelled')
  ])
  if (m?.has_avatar) {
    const { data: avatarData } = supabase.storage.from('member-avatars').getPublicUrl(`${uid}/avatar.jpg`)
    avatarUrl.value = avatarData.publicUrl + '?t=' + Date.now()
  }
  const freshStats = { total:0, completed:0, spent:'0' }
  if (orderData) {
    freshStats.total = orderData.length
    freshStats.completed = orderData.filter(o=>o.status==='completed').length
    const spent = orderData.filter(o=>o.status==='completed').reduce((s,o)=>s+Number(o.total_amount),0)
    freshStats.spent = spent>=1000 ? (spent/1000).toFixed(1)+'k' : spent.toFixed(0)
  }
  if (m) { member.full_name=m.full_name; member.phone=m.phone; member.region=m.region; member.level=m.level }
  stats.total=freshStats.total; stats.completed=freshStats.completed; stats.spent=freshStats.spent
  hppSetCache(CKEY, { member:m, stats:freshStats })
  if (!cached) state.value = 'ready'
})
</script>

<style scoped>
.header { position:sticky;top:0;z-index:100;height:var(--header-h);background:var(--card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;box-shadow:0 2px 12px rgba(44,24,16,0.06); }
.header-title { flex:1;font-family:var(--font-display);font-size:19px;color:var(--text); }
.main { padding:0 0 120px; }

.hero { background:linear-gradient(145deg,var(--primary) 0%,#E0408A 60%,var(--accent) 100%);padding:28px 20px 32px;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;overflow:hidden; }
.hero::before { content:'';position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.07); }
.hero::after  { content:'';position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.05); }
.avatar-wrap { position:relative;width:72px;height:72px;margin-bottom:12px; }
.avatar { width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.2);border:3px solid rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:28px;color:white;font-weight:600;overflow:hidden;position:relative;z-index:1; }
.avatar img { width:100%;height:100%;object-fit:cover; }
.avatar-upload { position:absolute;bottom:0;right:0;width:22px;height:22px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2; }
.avatar-input { display:none; }
.hero-name { font-family:var(--font-display);font-size:20px;color:white;font-weight:600;margin-bottom:6px;position:relative;z-index:1; }
.level-badge { display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:white;font-size:11px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;padding:4px 12px;border-radius:20px;margin-bottom:16px;position:relative;z-index:1; }
.stats-row { display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;width:100%;background:rgba(255,255,255,0.15);border-radius:var(--radius-sm);overflow:hidden;position:relative;z-index:1; }
.stat-item { background:rgba(255,255,255,0.1);padding:10px 8px;text-align:center; }
.stat-value { font-size:18px;font-weight:700;color:white; }
.stat-label { font-size:10px;color:rgba(255,255,255,0.7);margin-top:2px; }

.section { padding:16px 16px 0; }
.section-label { font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px; }

.info-card { background:var(--card);border-radius:var(--radius);border:1px solid rgba(232,216,212,0.6);overflow:hidden;box-shadow:0 2px 8px rgba(44,24,16,0.05);margin-bottom:14px; }
.info-row { display:flex;align-items:center;padding:13px 16px;border-bottom:1px solid var(--border); }
.info-icon { width:32px;height:32px;background:var(--primary-light);border-radius:var(--radius-xs);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:12px;color:var(--primary); }
.info-content { flex:1;min-width:0; }
.info-label { font-size:11px;color:var(--text-muted); }
.info-value { font-size:14px;font-weight:500;color:var(--text);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }

.form-group { margin-bottom:14px; }
.form-group label { display:block;font-size:13px;font-weight:500;color:var(--text);margin-bottom:6px; }
.input-wrap { position:relative; }
input { width:100%;padding:12px 44px 12px 14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:14px;color:var(--text);background:#FDFAF8;outline:none;transition:border-color 0.18s,box-shadow 0.18s;-webkit-appearance:none;box-sizing:border-box; }
input:focus { border-color:var(--primary);box-shadow:0 0 0 3px rgba(212,39,108,0.1);background:white; }
input::placeholder { color:#C5ABA8; }
.pass-toggle { position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px;display:flex;align-items:center; }
.alert { padding:10px 14px;border-radius:var(--radius-sm);font-size:13px;margin-bottom:12px;line-height:1.5; }
.alert-error   { background:#FEF0EE;color:var(--error);border:1px solid #F5C6C2; }
.alert-success { background:#EEF7F2;color:var(--success);border:1px solid #B8DEC8; }
.btn-primary { width:100%;padding:13px;background:linear-gradient(135deg,var(--primary) 0%,#E0408A 100%);color:white;border:none;border-radius:var(--radius-sm);font-family:var(--font-body);font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(212,39,108,0.3);transition:opacity 0.15s;display:flex;align-items:center;justify-content:center;gap:8px; }
.btn-primary:disabled { opacity:0.55;cursor:not-allowed; }
.spinner { width:14px;height:14px;border:2px solid rgba(255,255,255,0.35);border-top-color:white;border-radius:50%;animation:spin 0.65s linear infinite; }

.menu-card { background:var(--card);border-radius:var(--radius);border:1px solid rgba(232,216,212,0.6);overflow:hidden;box-shadow:0 2px 8px rgba(44,24,16,0.05);margin-bottom:14px; }
.menu-item { display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border);cursor:pointer;background:none;width:100%;text-align:left;font-family:var(--font-body);transition:background 0.12s; }
.menu-item:last-child { border-bottom:none; }
.menu-item:hover { background:var(--bg); }
.menu-icon { width:32px;height:32px;border-radius:var(--radius-xs);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:12px; }
.menu-text { flex:1; }
.menu-label { font-size:14px;font-weight:500;color:var(--text); }
.menu-desc  { font-size:12px;color:var(--text-muted);margin-top:1px; }
.menu-chevron { color:var(--text-muted); }
.ic-orders { background:#EEF7F2;color:#2E7D52; }
.ic-audit  { background:#E8DAEF;color:#512E5F; }
.ic-install{ background:#FDE8F2;color:var(--primary); }
.ic-logout { background:#FEF0EE;color:var(--error); }

.dialog-overlay { position:fixed;inset:0;background:rgba(44,24,16,0.45);display:flex;align-items:flex-end;z-index:200; }
.dialog { background:var(--card);border-radius:var(--radius) var(--radius) 0 0;padding:24px 20px 32px;width:100%;max-width:480px;margin:0 auto;box-shadow:0 -8px 32px rgba(44,24,16,0.15); }
.dialog-title { font-family:var(--font-display);font-size:18px;color:var(--text);margin-bottom:8px; }
.dialog-desc  { font-size:13.5px;color:var(--text-muted);margin-bottom:20px;line-height:1.5; }
.dialog-btns { display:flex;gap:10px; }
.dialog-btns button { flex:1;padding:13px;border-radius:var(--radius-sm);font-family:var(--font-body);font-size:14px;font-weight:600;cursor:pointer; }
.btn-keep    { background:none;border:1.5px solid var(--border);color:var(--text-muted); }
.btn-signout { background:var(--error);border:none;color:white; }
.fade-enter-active, .fade-leave-active { transition:opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity:0; }
</style>
