import { ref, readonly } from 'vue'

// Module-level capture — beforeinstallprompt fires early, before any component mounts
let _deferred = null
const canInstall = ref(false)

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    _deferred = e
    canInstall.value = true
  })
  window.addEventListener('appinstalled', () => {
    _deferred = null
    canInstall.value = false
  })
}

export function useInstallPrompt() {
  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigator.standalone === true

  const isIos     = /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window)
  const isAndroid = /android/i.test(navigator.userAgent)

  const showIosPrompt = isIos && !isInstalled

  const DISMISS_KEY = 'hpp_pwa_dismissed'
  const wasDismissed = () => !!localStorage.getItem(DISMISS_KEY)
  const dismiss = () => localStorage.setItem(DISMISS_KEY, '1')

  async function triggerInstall() {
    if (!_deferred) return null
    _deferred.prompt()
    const { outcome } = await _deferred.userChoice
    _deferred = null
    canInstall.value = false
    return outcome // 'accepted' | 'dismissed'
  }

  return {
    canInstall: readonly(canInstall),
    isInstalled,
    isIos,
    isAndroid,
    showIosPrompt,
    wasDismissed,
    dismiss,
    triggerInstall,
  }
}
