<template>
  <Transition name="install-slide">
    <div v-if="visible" class="install-overlay" @click.self="close">
      <div class="install-sheet">

        <!-- ── Icon ─────────────────────────────────────── -->
        <div class="install-icon-wrap">
          <svg width="28" height="28" fill="none" stroke="white" stroke-width="1.8" viewBox="0 0 24 24">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12" y2="18" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>

        <div class="install-title">Add to Home Screen</div>

        <!-- ── Android: native prompt ───────────────────── -->
        <template v-if="canInstall">
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

        <!-- ── iOS Safari + all other browsers: manual steps ── -->
        <template v-else>
          <p class="install-desc">
            <template v-if="isIos">
              Follow these steps in Safari to add Hartinna Partner to your home screen:
            </template>
            <template v-else>
              Open this page in your phone's browser, then follow these steps to install:
            </template>
          </p>
          <div class="ios-steps">
            <div class="ios-step">
              <span class="step-num">1</span>
              <span>Tap the
                <strong>Share</strong>
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display:inline;vertical-align:-2px;margin:0 2px">
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
import { ref, onMounted } from 'vue'
import { useInstallPrompt } from '@/composables/useInstallPrompt'

const props = defineProps({
  // Pass true from Profile page to force-show (ignores dismissed flag)
  force: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { canInstall, showIosPrompt, isInstalled, wasDismissed, dismiss, triggerInstall } = useInstallPrompt()

const visible = ref(false)

onMounted(() => {
  if (isInstalled) return
  if (!canInstall.value && !showIosPrompt) return

  if (props.force) {
    visible.value = true
    return
  }

  // Auto-show after 3 s on first visit (if not dismissed before)
  if (!wasDismissed()) {
    setTimeout(() => { visible.value = true }, 3000)
  }
})

function close() {
  dismiss()
  visible.value = false
  emit('close')
}

async function doInstall() {
  const outcome = await triggerInstall()
  if (outcome === 'accepted') {
    visible.value = false
    emit('close')
  }
}

// Allow parent to trigger it (Profile menu tap)
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
  padding: 28px 24px calc(40px + env(safe-area-inset-bottom, 16px));
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 -8px 40px rgba(212, 39, 108, 0.18);
  max-height: 90dvh;
  overflow-y: auto;
}

/* ── Icon ─────────────────────────────────────────────── */
.install-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(145deg, #f0588a 0%, #D4276C 50%, #9e1a50 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 6px 20px rgba(212, 39, 108, 0.35);
}

.install-title {
  font-size: 18px;
  font-weight: 700;
  color: #2c1820;
  margin-bottom: 10px;
}

.install-desc {
  font-size: 14px;
  color: #8a5a6e;
  line-height: 1.55;
  margin: 0 0 22px;
  max-width: 300px;
}

/* ── iOS steps ────────────────────────────────────────── */
.ios-steps {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
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

/* ── Transition ───────────────────────────────────────── */
.install-slide-enter-active { transition: transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.25s ease; }
.install-slide-leave-active { transition: transform 0.22s ease-in, opacity 0.2s ease-in; }
.install-slide-enter-from, .install-slide-leave-to {
  opacity: 0;
}
.install-slide-enter-from .install-sheet,
.install-slide-leave-to .install-sheet {
  transform: translateY(100%);
}
</style>
