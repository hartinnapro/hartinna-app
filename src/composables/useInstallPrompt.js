import { ref, readonly } from 'vue'

const INSTALLED_KEY = 'hpp_pwa_installed'
const DISMISS_KEY   = 'hpp_pwa_dismissed'

let _deferred = null
const canInstall = ref(false)

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    _deferred = e
    canInstall.value = true
  })

  // Set a localStorage flag the moment Android/Windows confirms installation.
  // This flag persists across browser and PWA window (same origin, shared storage)
  // so the menu item stays hidden even if display-mode detection fails.
  window.addEventListener('appinstalled', () => {
    localStorage.setItem(INSTALLED_KEY, '1')
    _deferred = null
    canInstall.value = false
  })
}

export function useInstallPrompt() {
  const isInstalled =
    !!localStorage.getItem(INSTALLED_KEY) ||          // ← most reliable: we set this ourselves
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigator.standalone === true                     // iOS standalone

  const isIos     = /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window)
  const isAndroid = /android/i.test(navigator.userAgent)

  const showIosPrompt = isIos && !isInstalled

  const wasDismissed = () => !!localStorage.getItem(DISMISS_KEY)
  const dismiss      = ()  => localStorage.setItem(DISMISS_KEY, '1')

  async function triggerInstall() {
    if (!_deferred) return null
    _deferred.prompt()
    const { outcome } = await _deferred.userChoice
    _deferred = null
    canInstall.value = false
    return outcome
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
