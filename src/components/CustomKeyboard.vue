<script setup>
/**
 * CustomKeyboard — reusable on-screen keyboard for HPP.
 *
 * Cross-platform model (works the same on iOS / Android / Windows):
 *  - The bound <input> stays a REAL, editable field (never readonly) with
 *    inputmode="none". That suppresses the native soft keyboard on mobile while
 *    keeping the field editable, so a PHYSICAL keyboard (Win, Android keyboard
 *    case, iPad Magic Keyboard) always types into it natively — both input
 *    methods work at once, no detection needed.
 *  - This component provides the touch/click on-screen keys, inserting at the
 *    input's caret position so it stays in sync with physical typing.
 *
 * v1 layout: full QWERTY (for the Full Name field). Other layouts (numeric etc.)
 * can be added later via the `layout` prop.
 */
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  // The actual <input> element this keyboard drives (passed by ref).
  target: { type: Object, default: null },
  visible: { type: Boolean, default: false },
  layout: { type: String, default: 'qwerty' },
  autoCapWords: { type: Boolean, default: true },
  maxlength: { type: Number, default: 0 }, // 0 = no limit
  sound: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'enter', 'hide'])

/* ----------------------------- key layout ------------------------------ */
const ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
]

/* --------------------------- shift / caps state ------------------------ */
// shift: false = follow auto-cap; true = force-invert next letter; 'lock' = caps lock
const shift = ref(false)
let lastShiftTap = 0

// Is the caret currently at a word-start boundary (start of field or after a space)?
function autoCapAtCaret() {
  if (!props.autoCapWords) return false
  const inp = props.target
  if (!inp) return false
  const pos = inp.selectionStart ?? (inp.value ? inp.value.length : 0)
  if (pos === 0) return true
  return /\s/.test(inp.value.charAt(pos - 1))
}

// Whether the NEXT letter typed will be uppercase (drives key display + insertion)
const upperNext = computed(() => {
  void tick.value // reactive dependency so keys re-render as caret/value change
  if (shift.value === 'lock') return true
  const auto = autoCapAtCaret()
  return shift.value === true ? !auto : auto
})

// bump this to force `upperNext` recompute after value/caret changes
const tick = ref(0)
function bump() { tick.value++ }

function onShift() {
  const now = Date.now()
  if (shift.value === 'lock') { shift.value = false }
  else if (now - lastShiftTap < 320) { shift.value = 'lock' } // double-tap → caps lock
  else { shift.value = shift.value === true ? false : true }
  lastShiftTap = now
}

/* ---------------------------- caret insertion -------------------------- */
function insertText(str) {
  const inp = props.target
  if (!inp) return
  let start = inp.selectionStart ?? inp.value.length
  let end = inp.selectionEnd ?? inp.value.length
  let val = inp.value
  let next = val.slice(0, start) + str + val.slice(end)
  if (props.maxlength > 0 && next.length > props.maxlength) {
    next = next.slice(0, props.maxlength)
  }
  const caret = Math.min(start + str.length, next.length)
  emit('update:modelValue', next)
  // restore caret after Vue writes the new value back to the DOM
  nextTick(() => {
    try { inp.setSelectionRange(caret, caret) } catch (e) {}
    bump()
  })
}

function backspaceOnce() {
  const inp = props.target
  if (!inp) return
  let start = inp.selectionStart ?? inp.value.length
  let end = inp.selectionEnd ?? inp.value.length
  let val = inp.value
  if (start === end) {
    if (start === 0) return
    start = start - 1
  }
  const next = val.slice(0, start) + val.slice(end)
  emit('update:modelValue', next)
  nextTick(() => {
    try { inp.setSelectionRange(start, start) } catch (e) {}
    bump()
  })
}

/* ------------------------------ key press ------------------------------ */
function pressLetter(k) {
  const ch = upperNext.value ? k.toUpperCase() : k
  insertText(ch)
  if (shift.value === true) shift.value = false // one-shot shift resets
  playSound()
}
function pressDigit(k) { insertText(k); playSound() }
function pressSpace() { insertText(' '); playSound() }
function pressReturn() { emit('enter'); playSound() }
function pressClear() {
  emit('update:modelValue', '')
  nextTick(() => { try { props.target?.setSelectionRange(0, 0) } catch (e) {}; bump() })
  playSound()
}

async function pressPaste() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) insertText(text)
  } catch (e) { /* clipboard blocked/empty — no-op */ }
}

/* --------------------- long-press backspace repeat --------------------- */
let bsTimer = null, bsInterval = null
function bsDown(e) {
  e.preventDefault()
  backspaceOnce(); playSound()
  bsTimer = setTimeout(() => {
    bsInterval = setInterval(() => { backspaceOnce(); playSound() }, 55)
  }, 400)
}
function bsUp() {
  clearTimeout(bsTimer); clearInterval(bsInterval)
  bsTimer = bsInterval = null
}

/* ------------------------------ keycap popup --------------------------- */
const keycap = reactive({ show: false, char: '', x: 0, y: 0 })
let keycapTimer = null
function showKeycap(ch, e) {
  const r = e.currentTarget.getBoundingClientRect()
  keycap.char = ch
  keycap.x = r.left + r.width / 2
  keycap.y = r.top
  keycap.show = true
  clearTimeout(keycapTimer)
}
function hideKeycap() {
  keycapTimer = setTimeout(() => { keycap.show = false }, 90)
}

/* -------------------------------- sound -------------------------------- */
let audioCtx = null, lastSound = 0
function playSound() {
  if (!props.sound) return
  const now = Date.now()
  if (now - lastSound < 20) return
  lastSound = now
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.type = 'sine'; o.frequency.value = 480
    g.gain.setValueAtTime(0.04, audioCtx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03)
    o.connect(g); g.connect(audioCtx.destination)
    o.start(); o.stop(audioCtx.currentTime + 0.03)
  } catch (e) {}
}

/* ------------------ pointer handler on letter/digit keys --------------- */
function onKeyDown(e, kind, k) {
  e.preventDefault() // never steal focus from the input
  if (kind === 'letter') { pressLetter(k); showKeycap((upperNext.value ? k.toUpperCase() : k), e) }
  else if (kind === 'digit') { pressDigit(k); showKeycap(k, e) }
}

// keep display in sync when target value changes from physical typing
watch(() => props.target && props.target.value, () => bump())
onMounted(() => bump())
onBeforeUnmount(() => bsUp())
</script>

<template>
  <Teleport to="body">
    <transition name="osk-slide">
      <div v-if="visible" class="osk" role="group" aria-label="On-screen keyboard">
        <!-- digit row -->
        <div class="osk-row">
          <button v-for="k in ROWS[0]" :key="k" class="osk-key osk-digit"
                  @pointerdown="onKeyDown($event, 'digit', k)"
                  @pointerup="hideKeycap" @pointerleave="hideKeycap">{{ k }}</button>
        </div>
        <!-- qwerty row -->
        <div class="osk-row">
          <button v-for="k in ROWS[1]" :key="k" class="osk-key"
                  @pointerdown="onKeyDown($event, 'letter', k)"
                  @pointerup="hideKeycap" @pointerleave="hideKeycap">{{ upperNext ? k.toUpperCase() : k }}</button>
        </div>
        <!-- asdf row (indented) -->
        <div class="osk-row osk-row-home">
          <button v-for="k in ROWS[2]" :key="k" class="osk-key"
                  @pointerdown="onKeyDown($event, 'letter', k)"
                  @pointerup="hideKeycap" @pointerleave="hideKeycap">{{ upperNext ? k.toUpperCase() : k }}</button>
        </div>
        <!-- shift + zxcv + backspace -->
        <div class="osk-row osk-row-z">
          <button class="osk-key osk-shift" :class="{ active: shift === true, lock: shift === 'lock' }"
                  @pointerdown.prevent="onShift" aria-label="Shift">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 4l8 8h-5v8h-6v-8H4z" :fill="shift ? 'currentColor' : 'none'"/>
            </svg>
          </button>
          <button v-for="k in ROWS[3]" :key="k" class="osk-key"
                  @pointerdown="onKeyDown($event, 'letter', k)"
                  @pointerup="hideKeycap" @pointerleave="hideKeycap">{{ upperNext ? k.toUpperCase() : k }}</button>
          <button class="osk-key osk-backspace"
                  @pointerdown="bsDown" @pointerup="bsUp" @pointerleave="bsUp" aria-label="Backspace">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">
              <path d="M8 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-6-7z"/>
              <path d="M12 9l4 6M16 9l-4 6"/>
            </svg>
          </button>
        </div>
        <!-- bottom control row -->
        <div class="osk-row osk-row-ctrl">
          <button class="osk-ctrl osk-paste" @pointerdown.prevent @click="pressPaste" aria-label="Paste">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            </svg>
          </button>
          <button class="osk-ctrl osk-clr" @pointerdown.prevent="pressClear">CLR</button>
          <button class="osk-ctrl osk-space" @pointerdown.prevent="pressSpace">space</button>
          <button class="osk-ctrl osk-return" @pointerdown.prevent="pressReturn">done</button>
        </div>
        <!-- dismiss chevron -->
        <button class="osk-dismiss" @pointerdown.prevent="emit('hide')" aria-label="Hide keyboard">
          <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
            <path d="M4 3L13 10L22 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </transition>

    <!-- keycap preview -->
    <transition name="osk-cap">
      <div v-if="keycap.show" class="osk-keycap" :style="{ left: keycap.x + 'px', top: keycap.y + 'px' }">{{ keycap.char }}</div>
    </transition>
  </Teleport>
</template>

<style scoped>
.osk {
  position: fixed;
  bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 100%; max-width: 480px;
  background: linear-gradient(180deg, #FCE9F1 0%, #F9DCEA 100%);
  border-top: 1px solid rgba(212, 39, 108, 0.18);
  box-shadow: 0 -4px 20px rgba(184, 31, 90, 0.16);
  padding: 8px 6px calc(14px + env(safe-area-inset-bottom, 0px));
  z-index: 4000;
  display: flex; flex-direction: column; gap: 7px;
  box-sizing: border-box;
  -webkit-user-select: none; user-select: none;
}
.osk-row { display: grid; grid-template-columns: repeat(20, 1fr); gap: 5px; }
.osk-row-home { padding: 0 calc(5% + 2px); }
.osk-key {
  grid-column: span 2;
  height: 44px;
  background: #fff;
  border: 1px solid rgba(212, 39, 108, 0.10);
  border-radius: 7px;
  color: #3a2731;
  font-size: 22px; font-weight: 500;
  font-family: inherit;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1.5px 0 rgba(184, 31, 90, 0.14);
  cursor: pointer; padding: 0; min-width: 0;
  touch-action: manipulation;
  transition: background .08s, transform .08s;
}
.osk-digit { font-size: 20px; font-weight: 450; color: #6a4a58; }
.osk-key:active { background: var(--primary-light, #FCE4EF); transform: scale(0.94); }

.osk-row-z { grid-template-columns: repeat(20, 1fr); }
.osk-shift, .osk-backspace { grid-column: span 3; background: #F3D3E1; color: var(--primary, #D4276C); }
.osk-shift.active { background: var(--primary, #D4276C); color: #fff; }
.osk-shift.lock { background: var(--primary-dark, #B81F5A); color: #fff; }
.osk-shift svg, .osk-backspace svg { pointer-events: none; }
.osk-row-z .osk-key:not(.osk-shift):not(.osk-backspace) { grid-column: span 2; }

.osk-row-ctrl { grid-template-columns: repeat(20, 1fr); gap: 5px; margin-top: 1px; }
.osk-ctrl {
  height: 44px; border: none; border-radius: 7px;
  font-family: inherit; font-size: 15px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  touch-action: manipulation; padding: 0; min-width: 0;
  box-shadow: 0 1.5px 0 rgba(184, 31, 90, 0.12);
  transition: transform .08s, filter .08s;
}
.osk-ctrl:active { transform: scale(0.95); filter: brightness(0.96); }
.osk-paste { grid-column: span 3; background: #F3D3E1; color: var(--primary, #D4276C); }
.osk-clr   { grid-column: span 3; background: #E9C4B4; color: #7a4a30; }
.osk-space { grid-column: span 9; background: #fff; color: #6a4a58; font-weight: 500; letter-spacing: .04em; }
.osk-return{ grid-column: span 5; background: var(--primary, #D4276C); color: #fff; }

.osk-dismiss {
  align-self: center; margin-top: 1px;
  width: 60px; height: 20px;
  background: none; border: none; cursor: pointer;
  color: rgba(184, 31, 90, 0.55);
  display: flex; align-items: center; justify-content: center;
}

.osk-keycap {
  position: fixed;
  transform: translate(-50%, -118%);
  min-width: 48px; height: 52px; padding: 0 10px;
  background: var(--primary, #D4276C); color: #fff;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 30px; font-weight: 600;
  pointer-events: none; z-index: 4100;
  box-shadow: 0 6px 16px rgba(184, 31, 90, 0.35);
}

/* transitions */
.osk-slide-enter-active, .osk-slide-leave-active { transition: transform .22s ease, opacity .22s ease; }
.osk-slide-enter-from, .osk-slide-leave-to { transform: translate(-50%, 100%); opacity: 0.6; }
.osk-cap-enter-active, .osk-cap-leave-active { transition: opacity .08s; }
.osk-cap-enter-from, .osk-cap-leave-to { opacity: 0; }
</style>
