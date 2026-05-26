<template>
  <Transition name="install-slide">
    <div v-if="visible" class="install-overlay" @click.self="!installing && close()">
      <div class="install-sheet">

        <!-- ── Success state ─────────────────────────────── -->
        <template v-if="installed">
          <div class="success-icon-wrap">
            <svg width="32" height="32" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="install-title">App Installed!</div>
          <p class="install-desc">Hartinna Partner has been added to your home screen. You can now launch it directly from there.</p>
          <button class="btn-install" @click="close">
            Done
          </button>
        </template>

        <!-- ── Installing state ──────────────────────────── -->
        <template v-else-if="installing">
          <div class="install-icon-wrap">
            <svg class="spin" width="28" height="28" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div class="install-title">Installing…</div>
          <p class="install-desc">
            {{ readyToConfirm
              ? 'Check your home screen — can you see the Hartinna Partner icon?'
              : 'Adding Hartinna Partner to your home screen.' }}
          </p>
          <div class="progress-bar-wrap">
            <div class="progress-bar"></div>
          </div>
          <button v-if="readyToConfirm" class="btn-install" @click="confirmInstalled">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Yes, I can see the icon!
          </button>
          <button v-if="readyToConfirm" class="btn-later" @click="confirmInstalled">Skip</button>
        </template>

        <!-- ── Android: native prompt ───────────────────── -->
        <template v-else-if="canInstall">
          <div class="install-icon-wrap">
            <svg width="28" height="28" fill="none" stroke="white" stroke-width="1.8" viewBox="0 0 24 24">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="15" x2="12" y2="8"/>
              <polyline points="9 12 12 15 15 12"/>
            </svg>
          </div>
          <div class="install-title">Add to Home Screen</div>
          <p class="install-desc">
            Install the Hartinna Partner app for the fastest experience —
            works offline and launches like a native app.
          </p>
          <button class="btn-install" @click="doInstall">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Install App
          </button>
          <button class="btn-later" @click="close">Maybe Later</button>
        </template>

        <!-- ── iOS / fallback: manual steps ─────────────── -->
        <template v-else>
          <div class="install-icon-wrap">
            <svg width="28" height="28" fill="none" stroke="white" stroke-width="1.8" viewBox="0 0 24 24">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="15" x2="12" y2="8"/>
              <polyline points="9 12 12 15 15 12"/>
            </svg>
          </div>
          <div class="install-title">Add to Home Screen</div>
          <p class="install-desc">
            {{ isIos ? 'Follow these steps in Safari:' : 'Open in your phone browser, then:' }}
          </p>
          <div class="ios-steps">
            <div class="ios-step">
              <span class="step-num">1</span>
              <span>Tap the <strong>Share</strong>
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display:inline;vertical-align:-2px;margin:0 2px">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                button at the bottom of your browser
              </span>
            </div>
            <div class="ios-step">
              <span class="step-num">2</span>
              <span>Tap <strong>Add to Home Screen</strong></span>
            </div>
            <div class="ios-step">
              <span class="step-num">3</span>
              <span>Tap <strong>Add</strong> to confirm</span>
            </div>
          </div>
          <button class="btn-install" @click="close">Got It</button>
          <button class="btn-later" @click="close">Close</button>
        </template>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useInstallPrompt } from '@/composables/useInstallPrompt'

const props = defineProps({
  force: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

const { canInstall, isIos, isAndroid, isInstalled, wasDismissed, dismiss, triggerInstall } = useInstallPrompt()

const visible         = ref(false)
const installing      = ref(false)
const readyToConfirm  = ref(false)   // appinstalled fired — waiting for user to confirm icon appeared
const installed       = ref(false)

let installStart = 0

function onAppInstalled() {
  // Chrome says done — but launcher may still be placing the icon.
  // Show a confirm button and let the user tell us when they see it.
  readyToConfirm.value = true
}

function confirmInstalled() {
  installing.value     = false
  readyToConfirm.value = false
  installed.value      = true
}

onMounted(() => {
  window.addEventListener('appinstalled', onAppInstalled)

  if (isInstalled) return

  if (!wasDismissed()) {
    setTimeout(() => { visible.value = true }, 3000)
  }
})

onUnmounted(() => {
  window.removeEventListener('appinstalled', onAppInstalled)
})

function close() {
  dismiss()
  visible.value    = false
  installing.value = false
  installed.value  = false
  emit('close')
}

async function doInstall() {
  const outcome = await triggerInstall()
  if (outcome === 'dismissed') return

  if (isAndroid) {
    // Android: show progress UI, wait for appinstalled + user confirmation
    installing.value = true
  } else {
    // Windows / desktop: Chrome opens the PWA natively — just close our sheet
    close()
  }
}

defineExpose({ open: () => { visible.value = true } })
</script>

<style scoped>
.install-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 10, 28, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 300;
}

.install-sheet {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: white;
  border-radius: 24px 24px 0 0;
  padding: 32px 24px calc(44px + env(safe-area-inset-bottom, 16px));
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 -8px 40px rgba(212, 39, 108, 0.18);
  max-height: 90dvh;
  overflow-y: auto;
}

/* ── Icons ────────────────────────────────────────────── */
.install-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: linear-gradient(145deg, #f0588a 0%, #D4276C 50%, #9e1a50 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  box-shadow: 0 6px 20px rgba(212, 39, 108, 0.35);
}

.success-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(145deg, #34c97a, #1e9e58);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  box-shadow: 0 6px 20px rgba(30, 158, 88, 0.35);
}

/* ── Text ─────────────────────────────────────────────── */
.install-title {
  font-size: 19px;
  font-weight: 700;
  color: #2c1820;
  margin-bottom: 10px;
}

.install-desc {
  font-size: 14px;
  color: #8a5a6e;
  line-height: 1.6;
  margin: 0 0 24px;
  max-width: 300px;
}

/* ── Progress bar ─────────────────────────────────────── */
.progress-bar-wrap {
  width: 100%;
  height: 6px;
  background: #f5e0eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 24px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #f0588a, #D4276C);
  border-radius: 3px;
  animation: progress-indeterminate 1.4s ease-in-out infinite;
}

@keyframes progress-indeterminate {
  0%   { transform: translateX(-100%) scaleX(0.5); }
  50%  { transform: translateX(0%)    scaleX(0.8); }
  100% { transform: translateX(100%)  scaleX(0.5); }
}

/* ── iOS steps ────────────────────────────────────────── */
.ios-steps {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 26px;
  text-align: left;
}

.ios-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  color: #4a2030;
  line-height: 1.5;
}

.step-num {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(145deg, #f0588a, #D4276C);
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

/* ── Buttons ──────────────────────────────────────────── */
.btn-install {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #f0588a 0%, #D4276C 50%, #9e1a50 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(212, 39, 108, 0.35);
  transition: opacity 0.15s;
}
.btn-install:active { opacity: 0.85; }

.btn-later {
  background: none;
  border: none;
  color: #b07090;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px;
}

/* ── Spinner ──────────────────────────────────────────── */
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Transition ───────────────────────────────────────── */
.install-slide-enter-active { transition: transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.25s ease; }
.install-slide-leave-active { transition: transform 0.22s ease-in, opacity 0.2s ease-in; }
.install-slide-enter-from, .install-slide-leave-to { opacity: 0; }
.install-slide-enter-from .install-sheet,
.install-slide-leave-to   .install-sheet { transform: translateY(100%); }
</style>
