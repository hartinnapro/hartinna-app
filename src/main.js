import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'

import './assets/variables.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// --- PWA auto-update (prompt-free, non-disruptive) ---
// A new deploy is applied automatically, but only while the app is in the
// background/hidden — so an agent is never interrupted mid-task. On reopen
// they get the fresh version. No banner, no "click to update".
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000 // hourly
let updatePending = false

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updatePending = true
    applyUpdateWhenHidden()
  },
  onRegisteredSW(swUrl, registration) {
    if (!registration) return
    // Long-lived sessions still pick up deploys: poll + re-check on refocus.
    setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL)
    window.addEventListener('focus', () => registration.update())
  }
})

function applyUpdateWhenHidden() {
  if (!updatePending) return
  if (document.visibilityState === 'hidden') {
    updatePending = false
    updateSW(true) // activate new SW + reload, while backgrounded
  }
}

document.addEventListener('visibilitychange', applyUpdateWhenHidden)
