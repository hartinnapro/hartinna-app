<template>
  <div class="page" :class="{ 'page-register': view === 'register' }">

    <!-- Brand -->
    <div class="brand">
      <div class="brand-mark" @click="showEasterEgg" style="cursor:pointer;">
        <img src="/hartinna_logo.png" alt="Hartinna" class="brand-logo" />
      </div>
      <div class="brand-img-wrap">
        <img src="/hartinna_brand.png" alt="Hartinna" class="brand-img" />
      </div>
    </div>

    <!-- Card: aurora-layer is a sibling rendered before the card so
         backdrop-filter reliably captures it across all browsers -->
    <div class="card-wrap">
      <div class="card-aurora-layer" aria-hidden="true"></div>
      <div class="card">
      <Transition name="fade" mode="out-in">

        <!-- LOGIN -->
        <form v-if="view === 'login'" key="login" @submit.prevent="doLogin">

          <div v-if="alert.msg" :class="['alert', 'alert-' + alert.type]">{{ alert.msg }}</div>

          <div class="form-group">
            <label for="login-email">Email or Username</label>
            <input id="login-email" ref="emailInputRef" v-model="L.email" type="text" placeholder="you@email.com or your_username"
              autocomplete="username" :class="{ err: E.email }" />
            <div v-if="E.email" class="field-error">{{ E.email }}</div>
          </div>

          <div class="form-group">
            <label for="login-password">Password</label>
            <div class="input-wrap">
              <input id="login-password" v-model="L.password" :type="showPw ? 'text' : 'password'"
                autocomplete="current-password" class="has-toggle" :class="{ err: E.password }"
                placeholder="Enter your password" />
              <button class="pass-toggle" :class="{ 'is-visible': showPw }" @click="showPw = !showPw" type="button" tabindex="-1">
                <svg v-if="!showPw" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle class="eye-pupil" cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <div v-if="E.password" class="field-error">{{ E.password }}</div>
          </div>

          <label class="keep-row" for="keep-me-check">
            <input type="checkbox" id="keep-me-check" v-model="keepMe" style="position:absolute;opacity:0;width:0;height:0;pointer-events:none;" />
            <div class="keep-check" :class="{ checked: keepMe }">
              <svg v-if="keepMe" width="12" height="9" viewBox="0 0 12 9" fill="none">
                <path d="M1.5 4.5L4.5 7.5L10.5 1.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="keep-label">Keep me signed in for 7 days</span>
          </label>

          <div class="btn-wrap">
            <button
              class="btn"
              :class="{ glassy: isGlassy }"
              @mousedown="triggerGlass"
              @touchstart.passive="triggerGlass"
              type="submit"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner"></span>
              {{ loading ? 'Opening…' : 'Open sesame' }}
              <svg v-if="!loading" class="sparkle-icon" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="metal-base" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stop-color="#ffffff"/>
                    <stop offset="30%"  stop-color="#d8d8ef"/>
                    <stop offset="55%"  stop-color="#9090b8"/>
                    <stop offset="80%"  stop-color="#d0d0e8"/>
                    <stop offset="100%" stop-color="#f8f8ff"/>
                  </linearGradient>
                  <linearGradient id="metal-shine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="white" stop-opacity="0"/>
                    <stop offset="45%"  stop-color="white" stop-opacity="0"/>
                    <stop offset="50%"  stop-color="white" stop-opacity="0.85"/>
                    <stop offset="55%"  stop-color="white" stop-opacity="0"/>
                    <stop offset="100%" stop-color="white" stop-opacity="0"/>
                    <animateTransform attributeName="gradientTransform" type="translate"
                      from="-1 0" to="2 0" dur="4s" repeatCount="indefinite"/>
                  </linearGradient>
                  <radialGradient id="metal-depth" cx="38%" cy="35%" r="55%">
                    <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.9"/>
                    <stop offset="60%"  stop-color="#c0c0d8" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#808090" stop-opacity="0.2"/>
                  </radialGradient>
                  <filter id="star-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <!-- Large 4-point star -->
                <g class="sparkle-group">
                  <path d="M11 0.5 L12.9 8.6 L21 11 L12.9 13.4 L11 21.5 L9.1 13.4 L1 11 L9.1 8.6 Z" fill="url(#metal-base)"/>
                  <path d="M11 0.5 L12.9 8.6 L21 11 L12.9 13.4 L11 21.5 L9.1 13.4 L1 11 L9.1 8.6 Z" fill="url(#metal-shine)"/>
                  <path d="M11 0.5 L12.9 8.6 L21 11 L12.9 13.4 L11 21.5 L9.1 13.4 L1 11 L9.1 8.6 Z" fill="url(#metal-depth)"/>
                  <!-- Small top-right star -->
                  <path d="M17.5 2 L18.3 5 L21 5.8 L18.3 6.5 L17.5 9.5 L16.7 6.5 L14 5.8 L16.7 5 Z" fill="url(#metal-base)" opacity="0.85"/>
                  <path d="M17.5 2 L18.3 5 L21 5.8 L18.3 6.5 L17.5 9.5 L16.7 6.5 L14 5.8 L16.7 5 Z" fill="url(#metal-shine)" opacity="0.85"/>
                  <!-- Small bottom-left star -->
                  <path d="M4 14 L4.6 16.4 L7 17 L4.6 17.6 L4 20 L3.4 17.6 L1 17 L3.4 16.4 Z" fill="url(#metal-base)" opacity="0.65"/>
                  <path d="M4 14 L4.6 16.4 L7 17 L4.6 17.6 L4 20 L3.4 17.6 L1 17 L3.4 16.4 Z" fill="url(#metal-shine)" opacity="0.65"/>
                </g>
              </svg>
            </button>
          </div>
        </form>

        <!-- REGISTER -->
        <div v-else-if="view === 'register'" key="register" class="reg-shell">
          <div class="reg-header">
            <button class="back-btn" @click="view = 'login'" aria-label="Back to sign in">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <div class="card-title">Become a Partner</div>
          </div>
          <div class="reg-scroll" ref="regScroll" @scroll="updateScrollCue">

          <div v-if="alert.msg" :class="['alert', 'alert-' + alert.type]">{{ alert.msg }}</div>

          <div class="form-group">
            <label for="reg-fullname">Full Name</label>
            <input id="reg-fullname" ref="fullNameInput" v-model="R.fullName" type="text"
                   inputmode="none" autocomplete="off" readonly style="text-transform: uppercase"
                   placeholder="As per IC / Passport" :class="{ err: E.fullName }"
                   @focus="openOsk" @click="openOsk" @keydown="onFullNameKeydown" />
            <div v-if="E.fullName" class="field-error">{{ E.fullName }}</div>
          </div>

          <CustomKeyboard
            ref="fullNameKb"
            :target="fullNameInput"
            :visible="oskVisible"
            layout="qwerty"
            :force-upper="true"
            :maxlength="60"
            :sound="true"
            @update:modelValue="val => { R.fullName = val; E.fullName = '' }"
            @enter="closeOsk"
            @hide="closeOsk" />

          <div class="form-group">
            <label for="reg-username">Username</label>
            <input id="reg-username" v-model="R.username" type="text" placeholder="e.g. sarah_kl"
              autocomplete="username" :class="{ err: E.username }"
              @input="R.username = R.username.toLowerCase().replace(/[^a-z0-9_-]/g, '')" />
            <div v-if="E.username" class="field-error">{{ E.username }}</div>
            <div v-else class="field-hint">3–20 chars, letters, numbers, _ or - only. Used to log in.</div>
          </div>

          <div class="form-group">
            <label for="reg-email">Email Address <span class="optional">(optional)</span></label>
            <input id="reg-email" v-model="R.email" type="email" placeholder="you@email.com" :class="{ err: E.email }" />
            <div v-if="E.email" class="field-error">{{ E.email }}</div>
            <div v-else class="field-hint">Leave blank if you don't have one — your username will be used to log in.</div>
          </div>

          <div class="form-group">
            <label for="reg-phone">Phone Number</label>
            <input id="reg-phone" v-model="R.phone" type="tel" placeholder="+60123456789" :class="{ err: E.phone }" />
            <div v-if="E.phone" class="field-error">{{ E.phone }}</div>
            <div v-else class="field-hint">Include country code, e.g. +60123456789</div>
          </div>

          <div class="form-group">
            <label for="reg-region">State / Region</label>
            <div class="select-wrap">
              <select id="reg-region" v-model="R.region" :class="{ err: E.region }">
                <option value="" disabled>Select your state</option>
                <option v-for="s in states" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div v-if="E.region" class="field-error">{{ E.region }}</div>
          </div>

          <div class="form-group">
            <label for="reg-password">Password</label>
            <div class="input-wrap">
              <input id="reg-password" v-model="R.password" :type="showPw ? 'text' : 'password'"
                autocomplete="new-password" class="has-toggle" :class="{ err: E.password }" placeholder="Min. 8 characters" />
              <button class="pass-toggle" @click="showPw = !showPw" type="button" tabindex="-1">
                <svg v-if="!showPw" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <div v-if="E.password" class="field-error">{{ E.password }}</div>
          </div>

          <div class="form-group">
            <label for="reg-confirmpw">Confirm Password</label>
            <input id="reg-confirmpw" v-model="R.confirmPw" :type="showPw ? 'text' : 'password'"
              autocomplete="new-password" class="has-toggle" :class="{ err: E.confirmPw }" placeholder="Repeat your password" />
            <div v-if="E.confirmPw" class="field-error">{{ E.confirmPw }}</div>
          </div>

          <div class="divider">optional</div>

          <div class="form-group">
            <label for="reg-referrer">Referrer's Phone Number <span class="optional">(upline)</span></label>
            <input id="reg-referrer" v-model="R.referrerPhone" type="tel" placeholder="+60123456789" />
            <div class="field-hint">Ask your upline for their registered phone number</div>
          </div>

          <button class="btn" @click="doRegister" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Creating account…' : 'Create Account' }}
          </button>

          <div class="toggle-link reg-toggle">
            <span>Already have an account? <a @click="go('login')">Sign in</a></span>
          </div>
          </div><!-- /reg-scroll -->

          <button class="scroll-cue" :class="{ show: showScrollCue }" @click="scrollCueTap" aria-label="Scroll down">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        <!-- FORGOT EMAIL -->
        <div v-else-if="view === 'forgot_email'" key="forgot_email">
          <button class="back-btn" @click="view = 'login'" aria-label="Back to sign in">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div class="card-title" style="margin-bottom:5px;">Forgot your email? 💭</div>
          <div class="card-subtitle">Enter your registered phone number and we'll show your email.</div>

          <div v-if="alert.msg" :class="['alert', 'alert-' + alert.type]">{{ alert.msg }}</div>

          <div v-if="foundEmail" class="found-email-box">
            <div class="found-label">Your registered email is:</div>
            <div class="found-value">{{ foundEmail }}</div>
            <button class="use-email-btn" @click="useFoundEmail">Use this email to sign in</button>
          </div>

          <template v-else>
            <div class="form-group">
              <label for="forgot-phone">Phone Number</label>
              <input
                id="forgot-phone"
                v-model="phoneQuery"
                type="tel"
                placeholder="+60123456789"
                @input="phoneQuery = phoneQuery.replace(/[^0-9+]/g, '')"
                @keyup.enter="lookupEmail"
              />
            </div>
            <button class="btn" @click="lookupEmail" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              {{ loading ? 'Searching…' : 'Find My Email' }}
            </button>
          </template>
        </div>
        <div v-else-if="view === 'success'" key="success" class="success-block">
          <div class="success-icon">
            <svg width="28" height="28" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="card-title" style="margin-bottom:8px">Account Created!</div>
          <div class="card-subtitle" style="margin-bottom:0">
            Welcome to Hartinna Partner. Your account is under review — our team will activate it shortly.
          </div>
        </div>

      </Transition>

      <div class="toggle-link" v-if="view === 'login' || view === 'forgot_email'">
        <span v-if="view === 'login'">
          New partner? <a @click="go('register')">Register here</a>
          <span class="toggle-sep">·</span>
          <a @click="go('forgot_email')">Forgot email?</a>
        </span>
        <span v-else>Already have an account? <a @click="go('login')">Sign in</a></span>
      </div>
    </div>
    </div><!-- /card-wrap -->

    <div class="footer">© 2026 Hartinna Partner · All rights reserved</div>

    <!-- 彩蛋 Easter egg -->
    <Transition name="egg">
      <div class="egg-overlay" v-if="eggVisible" @click="eggVisible = false">
        <div class="egg-sheet" @click.stop>
          <div class="egg-figure">
            <img src="/hartinna_logo.png" alt="" class="egg-logo" />
          </div>
          <div class="egg-msg">{{ eggMsg }}</div>
          <button class="egg-close" @click="eggVisible = false">💕 谢谢</button>
        </div>
      </div>
    </Transition>

    <!-- Help bubble -->
    <button class="help-bubble" @click="helpVisible = true" aria-label="Help">?</button>

    <!-- Help form -->
    <Transition name="egg">
      <div class="egg-overlay" v-if="helpVisible" @click="helpVisible = false">
        <div class="egg-sheet help-sheet" @click.stop>

          <template v-if="helpSent">
            <div class="help-success-icon">💌</div>
            <div class="egg-msg" style="margin-bottom:8px;">Message sent!</div>
            <div class="help-sub">Our team will get back to you shortly.</div>
            <button class="egg-close" @click="helpVisible = false; helpSent = false">Done</button>
          </template>

          <template v-else>
            <div class="help-title">Need a hand? 🌸</div>
            <div class="help-sub">Can't log in? Leave us a message and we'll sort it out.</div>

            <div v-if="helpAlert" class="alert alert-error" style="margin-bottom:14px;text-align:left;">{{ helpAlert }}</div>

            <div class="help-form">
              <div class="form-group">
                <label for="help-name">Your Name</label>
                <input id="help-name" v-model="helpForm.name" type="text" placeholder="Full name" />
              </div>
              <div class="form-group">
                <label for="help-email">Email Address</label>
                <input id="help-email" v-model="helpForm.email" type="email" placeholder="you@email.com" />
              </div>
              <div class="form-group">
                <label for="help-phone">Phone <span class="optional">(optional)</span></label>
                <input id="help-phone" v-model="helpForm.phone" type="tel" placeholder="+60123456789"
                  @input="helpForm.phone = helpForm.phone.replace(/[^0-9+]/g, '')" />
              </div>
              <div class="form-group">
                <label for="help-issue">What's the issue?</label>
                <textarea id="help-issue" v-model="helpForm.issue" placeholder="Describe what's happening…" rows="3"></textarea>
              </div>
            </div>

            <button class="egg-close help-submit" @click="submitHelp" :disabled="helpLoading">
              <span v-if="helpLoading" class="spinner" style="border-top-color:var(--primary);border-color:rgba(212,39,108,0.2);"></span>
              {{ helpLoading ? 'Sending…' : 'Send Message 💌' }}
            </button>
          </template>

        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import CustomKeyboard from '@/components/CustomKeyboard.vue'

const router = useRouter()

// ── Custom on-screen keyboard (prototype: Full Name field) ───────────────────
const fullNameInput = ref(null)   // ref to the actual <input>
const fullNameKb    = ref(null)   // ref to the CustomKeyboard component
const regScroll     = ref(null)   // the scrollable fields area
const oskVisible    = ref(false)  // keyboard shown while the field is active
const showScrollCue = ref(false)  // scroll-down circle button visibility

// Physical keyboard support. The input is readonly (to suppress the native soft
// keyboard on every platform), so native typing is blocked — we route hardware
// key presses in manually. Copy/paste/select and navigation keys pass through.
function onFullNameKeydown(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === 'Backspace') { e.preventDefault(); fullNameKb.value?.backspace() }
  else if (e.key === 'Enter') { e.preventDefault(); closeOsk() }
  else if (e.key.length === 1) { e.preventDefault(); fullNameKb.value?.typeChar(e.key) }
  // arrows / Home / End / Tab: let the readonly input handle caret natively
}

// Scroll a focused field so BOTH its label and input sit above the keyboard —
// but only if it isn't already comfortably in view, to avoid a needless jump.
function revealField(inputEl) {
  const sc = regScroll.value
  if (!sc || !inputEl) return
  const group = inputEl.closest('.form-group') || inputEl
  const scRect = sc.getBoundingClientRect()
  const gRect = group.getBoundingClientRect()
  const currentTop = gRect.top - scRect.top // field's distance from the scroll viewport top
  // Already sitting in the upper half and fully below the top edge → leave it.
  if (currentTop >= 0 && currentTop <= sc.clientHeight * 0.45) return
  const target = sc.scrollTop + currentTop - 12
  sc.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
}

function openOsk() {
  oskVisible.value = true
  nextTick(() => {
    if (regScroll.value) regScroll.value.style.paddingBottom = '64px'
    setTimeout(() => revealField(fullNameInput.value), 80)
    updateScrollCue()
  })
}
function closeOsk() {
  oskVisible.value = false
  if (regScroll.value) regScroll.value.style.paddingBottom = ''
  updateScrollCue()
}

// Show the down-cue while content is still hidden below the fold.
function updateScrollCue() {
  const sc = regScroll.value
  if (!sc) { showScrollCue.value = false; return }
  const overflow = sc.scrollHeight - sc.clientHeight
  showScrollCue.value = overflow > 6 && (overflow - sc.scrollTop) > 6
}
function scrollCueTap() {
  const sc = regScroll.value
  if (!sc) return
  sc.scrollBy({ top: sc.clientHeight * 0.75, behavior: 'smooth' })
}

const view    = ref('login')

// ── Help centre ──────────────────────────────────────────────────────────────
const helpVisible = ref(false)
const helpSent    = ref(false)
const helpLoading = ref(false)
const helpAlert   = ref('')
const helpForm    = reactive({ name: '', email: '', phone: '', issue: '' })

async function submitHelp() {
  helpAlert.value = ''
  if (!helpForm.name.trim())  { helpAlert.value = 'Please enter your name.';  return }
  if (!helpForm.email.trim()) { helpAlert.value = 'Please enter your email.'; return }
  const emailVal = helpForm.email.trim()
  const emailInput = document.createElement('input')
  emailInput.type = 'email'
  emailInput.value = emailVal
  // Local part: alphanumeric blocks separated by single special chars (. _ + -)
  // Domain: proper hostname + TLD 2+ chars
  const strictEmail = /^[a-zA-Z0-9]+([._+\-][a-zA-Z0-9]+)*@[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/.test(emailVal)
  if (!emailInput.checkValidity() || !strictEmail) { helpAlert.value = 'Please enter a valid email address.'; return }
  if (!helpForm.issue.trim()) { helpAlert.value = 'Please describe your issue.'; return }

  helpLoading.value = true
  try {
    const phone = helpForm.phone.trim().replace(/[^0-9+]/g, '')
    if (helpForm.phone.trim() && !phone) {
      helpAlert.value = 'Phone number can only contain numbers and +.'
      helpLoading.value = false
      return
    }
    const { error } = await supabase.from('support_tickets').insert({
      name:  helpForm.name.trim(),
      email: helpForm.email.trim().toLowerCase(),
      phone: phone || null,
      issue: helpForm.issue.trim()
    })
    if (error) throw new Error(error.message)
    helpForm.name = ''; helpForm.email = ''; helpForm.phone = ''; helpForm.issue = ''
    helpSent.value = true
  } catch (e) {
    console.error('Support ticket error:', e)
    helpAlert.value = e?.message || 'Failed to send. Please try again.'
  } finally {
    helpLoading.value = false
  }
}
const EGGS = [
  '你今天也很美哦！ ✨',
  '美丽是你与生俱来的权利 🌸',
  'You glow differently today 💕',
  '韩缇娜与你同行，每一步都优雅 👑',
  'Self-care is not selfish — it\'s essential 🌷',
  '今天，为自己而美 🎀',
  'You are your own kind of beautiful 💫',
  '美，从内而外，真心无敌！ 🌺',
  'Hartinna sees you. You\'re radiant 💖',
  '每一天都是成为更好自己的机会 🦋'
]
const eggVisible = ref(false)
const eggMsg     = ref('')
let   lastEggIdx = -1

function showEasterEgg() {
  let idx
  do { idx = Math.floor(Math.random() * EGGS.length) } while (idx === lastEggIdx)
  lastEggIdx   = idx
  eggMsg.value = EGGS[idx]
  eggVisible.value = true
}

const isGlassy = ref(false)
let glassTimer = null

function triggerGlass() {
  clearTimeout(glassTimer)
  isGlassy.value = true
  glassTimer = setTimeout(() => { isGlassy.value = false }, 380)
}
const loading = ref(false)
const showPw  = ref(false)
const keepMe  = ref(false)

// ── Forgot email ──────────────────────────────────────────────────────────────
const phoneQuery  = ref('')
const foundEmail  = ref('')  // masked display
const realEmail   = ref('')  // full email for pre-fill
const emailInputRef = ref(null)

function maskEmail(email) {
  const [local, domain] = email.split('@')
  const masked = local.length <= 2
    ? local[0] + '***'
    : local.slice(0, 2) + '***' + local.slice(-1)
  return masked + '@' + domain
}

async function lookupEmail() {
  clear()
  const phone = phoneQuery.value.trim()
  if (!phone) { setAlert('Please enter your phone number.'); return }
  loading.value = true
  try {
    const { data, error } = await supabase.rpc('rpc_lookup_email_by_phone', { p_phone: phone })
    if (error) {
      console.error('RPC error details:', JSON.stringify(error))
      throw error
    }
    if (!data) {
      setAlert('No account found with this phone number. Please contact support.')
    } else {
      realEmail.value   = data
      foundEmail.value  = maskEmail(data)
    }
  } catch (e) {
    console.error('Lookup error:', e)
    setAlert('Something went wrong. Please try again.')
  } finally {
    loading.value = false
  }
}

async function useFoundEmail() {
  go('login')
  foundEmail.value = ''
  phoneQuery.value = ''
  realEmail.value  = ''
  await nextTick()
  setTimeout(() => {
    if (emailInputRef.value) {
      emailInputRef.value.focus()
      emailInputRef.value.classList.add('glow-focus')
      setTimeout(() => emailInputRef.value?.classList.remove('glow-focus'), 1800)
    }
  }, 220)
}

const alert = reactive({ type: 'error', msg: '' })
const E     = reactive({})

const L = reactive({ email: '', password: '' })
const R = reactive({
  fullName: '', username: '', email: '', phone: '',
  region: '', password: '', confirmPw: '',
  referrerPhone: ''
})

const states = [
  'Johor','Kedah','Kelantan','Kuala Lumpur','Labuan',
  'Melaka','Negeri Sembilan','Pahang','Penang','Perak',
  'Perlis','Putrajaya','Sabah','Sarawak','Selangor','Terengganu'
]

onMounted(async () => {
  document.documentElement.classList.add('aurora-bg')

  // Pre-fill email BEFORE any await — if this runs after getSession() resolves,
  // the reactive v-model update fires while iOS is animating the keyboard open
  // and cancels it (Paste/AutoFill appears but keyboard never shows on iOS PWA).
  try {
    const last = localStorage.getItem('hpp_last_email')
    if (last) L.email = last
  } catch {}

  // Auto-redirect if already logged in
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const keepUntil = localStorage.getItem('hpp_keep_until')
      if (!keepUntil || Date.now() < parseInt(keepUntil)) {
        window.scrollTo({ top: 0, behavior: 'instant' })
      router.push('/home')
        return
      }
    }
  } catch {}
})

onUnmounted(() => {
  document.documentElement.classList.remove('aurora-bg')
  document.documentElement.style.background = ''
  document.documentElement.style.backgroundImage = ''
})

function clear() {
  alert.msg = ''
  Object.keys(E).forEach(k => delete E[k])
}

function go(to) {
  clear()
  showPw.value = false
  if (to === 'forgot_email') L.email = ''
  view.value = to
  if (to === 'register') nextTick(() => setTimeout(updateScrollCue, 50))
}

function setAlert(msg, type = 'error') {
  alert.type = type
  alert.msg  = msg
}

async function doLogin() {
  clear()
  if (!L.email.trim()) E.email    = 'Email or username is required'
  if (!L.password)     E.password = 'Password is required'
  if (E.email || E.password) return

  loading.value = true
  try {
    // Resolve username → email if no @ detected
    let loginEmail = L.email.trim()
    if (!loginEmail.includes('@')) {
      const { data: resolved, error: resolveErr } = await supabase
        .rpc('rpc_lookup_email_by_username', { p_username: loginEmail })
      if (resolveErr || !resolved) {
        setAlert('Username not found. Please check and try again.')
        loading.value = false
        return
      }
      loginEmail = resolved
    }

    const { error } = await supabase.auth.signInWithPassword({
      email:    loginEmail,
      password: L.password
    })
    if (error) {
      const msg = error.message || ''
      setAlert(
        msg.includes('Invalid login credentials')
          ? 'Email or password is incorrect. Please try again.'
          : msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('too many') || error.status === 429
          ? 'Too many attempts. Please wait a moment before trying again.'
          : msg || 'Something went wrong. Please try again.'
      )
    } else {
      try {
        localStorage.setItem('hpp_last_email', L.email.trim())
        localStorage.setItem('hpp_keep_pref', keepMe.value ? '1' : '0')
        if (keepMe.value) {
          localStorage.setItem('hpp_keep_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000))
        } else {
          localStorage.removeItem('hpp_keep_until')
        }
      } catch {}
      window.scrollTo({ top: 0, behavior: 'instant' })
      router.push('/home')
    }
  } catch {
    setAlert('Something went wrong. Please try again.')
  } finally {
    loading.value = false
  }
}

async function doRegister() {
  clear()
  if (!R.fullName.trim())  E.fullName  = 'Full name is required'

  // Username validation
  if (!R.username.trim())  E.username  = 'Username is required'
  else if (!/^[a-z0-9_-]{3,20}$/.test(R.username))
                           E.username  = 'Must be 3–20 chars: letters, numbers, _ or -'

  // Email optional — validate only if provided
  if (R.email.trim()) {
    const emailInput = document.createElement('input')
    emailInput.type = 'email'; emailInput.value = R.email.trim()
    const strictEmail = /^[a-zA-Z0-9]+([._+\-][a-zA-Z0-9]+)*@[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/.test(R.email.trim())
    if (!emailInput.checkValidity() || !strictEmail) E.email = 'Please enter a valid email address.'
  }

  if (!R.phone.trim())            E.phone     = 'Phone number is required'
  if (!R.region)                  E.region    = 'Please select your state'
  if (R.password.length < 8)      E.password  = 'Password must be at least 8 characters'
  if (R.password !== R.confirmPw) E.confirmPw = 'Passwords do not match'
  if (Object.keys(E).length) return

  loading.value = true
  try {
    // Use real email or generate system email from username
    const authEmail = R.email.trim()
      ? R.email.trim().toLowerCase()
      : `${R.username.trim()}@hartinna.internal`

    const { error: signUpErr } = await supabase.auth.signUp({
      email:    authEmail,
      password: R.password
    })
    if (signUpErr) throw signUpErr

    const { error: profileErr } = await supabase.rpc('rpc_register_member', {
      p_full_name:      R.fullName.trim(),
      p_phone:          R.phone.trim(),
      p_region:         R.region,
      p_referrer_phone: R.referrerPhone.trim() || null,
      p_username:       R.username.trim()
    })
    if (profileErr) throw profileErr

    view.value = 'success'
  } catch (e) {
    const msg = e?.message || ''
    setAlert(
      msg.includes('already registered')       ? 'This email is already registered. Please sign in.'
      : msg.includes('phone number is already') ? 'This phone number is already registered.'
      : msg.includes('username is already')     ? 'This username is already taken. Please choose another.'
      : msg.includes('Referrer not found')      ? 'Referrer phone number not found. Please check and try again.'
      : msg || 'Registration failed. Please try again.'
    )
  } finally {
    loading.value = false
  }
}
</script>

<style>
/* html/body: colour fallback for overscroll zone only.
   Aurora animation lives on .page (directly behind the glass card)
   so backdrop-filter captures the moving gradient. No overflow on
   .page so the iOS keyboard issue does NOT return. */
html.aurora-bg {
  background: #FEF2F8;
  background-image:
    radial-gradient(ellipse at 20% 20%, rgba(255,210,235,0.9) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(230,100,160,0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 60% 10%, rgba(245,190,235,0.55) 0%, transparent 45%),
    radial-gradient(ellipse at 10% 80%, rgba(255,225,242,0.7) 0%, transparent 45%);
  background-size: 200% 200%;
  animation: aurora-shift 12s ease-in-out infinite;
}
html.aurora-bg body { background-color: transparent; background-image: none; animation: none; max-width: none; }
@keyframes aurora-shift {
  0%   { background-position: 0% 50%; }
  25%  { background-position: 100% 0%; }
  50%  { background-position: 100% 100%; }
  75%  { background-position: 0% 100%; }
  100% { background-position: 0% 50%; }
}
</style>

<style scoped>
/* ── PWA launch screen ───────────────────────────────────────────────────── */
.launch-screen {
  min-height: 100svh;
  display: flex; align-items: center; justify-content: center;
  background: #FEF2F8;
}
.launch-spinner {
  width: 36px; height: 36px;
  border: 3px solid rgba(212,39,108,0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ── Forgot email ────────────────────────────────────────────────────────── */
.found-email-box {
  background: var(--primary-light);
  border-radius: var(--radius-sm);
  padding: 16px; text-align: center;
  margin-bottom: 16px;
}
.found-label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.found-value {
  font-size: 18px; font-weight: 700; color: var(--primary);
  letter-spacing: 0.03em; margin-bottom: 14px;
}
.use-email-btn {
  background: var(--primary); color: white;
  border: none; border-radius: 50px;
  padding: 10px 24px; font-family: var(--font-body);
  font-size: 13.5px; font-weight: 600; cursor: pointer;
  transition: opacity 0.15s;
}
.use-email-btn:hover { opacity: 0.88; }

.toggle-sep { margin: 0 6px; color: var(--border); }

/* Variables live in src/assets/variables.css — do NOT redefine :root here */

.page {
  font-family: 'DM Sans', sans-serif;
  background: transparent;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px 32px;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;}

/* Register: top-align so the gap above the brand equals the brand→card gap (16px) */
.page-register {
  justify-content: flex-start;
  padding-top: 16px;
  height: 100svh;        /* lock to viewport — only the fields area scrolls */
  min-height: 0;
  overflow: hidden;      /* brand row + card header stay frozen */
}
/* Register only: compact brand row (logo left, wordmark right) */
.page-register .brand { flex-direction: row; gap: 12px; margin-bottom: 16px; }
.page-register .brand-mark { width: 56px; height: 56px; margin-bottom: 0; }
.page-register .brand-logo { width: 56px; height: 56px; }
.page-register .brand-img { width: 118px; }

/* Register: card expands to fill the space between brand and footer */
.page-register .brand { flex-shrink: 0; }
.page-register .footer { flex-shrink: 0; }
.page-register .card-wrap { flex: 1 1 auto; min-height: 0; display: flex; }
.page-register .card { display: flex; flex-direction: column; min-height: 0; width: 100%; padding-top: 14px; }

/* ── Shimmer aurora ──────────────────────────────────────────────────────── */
/* Animation lives on html.aurora-bg (global style above) */

/* ── Brand ───────────────────────────────────────────────────────────────── */
.brand {
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 24px;
}

/* Logo icon — metallic steel lighting via filter animation */
.brand-mark {
  width: 108px; height: 108px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
  position: relative;
}
.brand-logo {
  width: 108px; height: 108px; object-fit: contain;
  animation: steel-light 6s ease-in-out infinite;
}
@keyframes steel-light {
  0%   { filter: drop-shadow(-3px -3px 5px rgba(210,225,255,0)) brightness(1); }
  15%  { filter: drop-shadow(-4px -4px 8px rgba(210,225,255,0.7)) brightness(1.35); }
  30%  { filter: drop-shadow(3px 2px 6px rgba(190,210,255,0.3)) brightness(1.1); }
  50%  { filter: drop-shadow(0px 0px 10px rgba(210,225,255,0.5)) brightness(1.2); }
  70%  { filter: drop-shadow(-2px -4px 7px rgba(200,220,255,0.4)) brightness(1.12); }
  100% { filter: drop-shadow(-3px -3px 5px rgba(210,225,255,0)) brightness(1); }
}

/* Brand wordmark image — light pink layered tones + metallic sweep */
.brand-img-wrap {
  display: block;
  line-height: 0;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 2px;
}
.brand-img-wrap::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  left: -100%;
  width: 55%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.08) 35%,
    rgba(255,255,255,0.45) 50%,
    rgba(255,255,255,0.08) 65%,
    transparent 100%
  );
  transform: skewX(-6deg);
  mix-blend-mode: screen;
  animation: brand-shimmer 5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes brand-shimmer {
  0%        { left: -100%; }
  45%, 100% { left: 200%; }
}
.brand-img {
  width: 168px;
  /* Invert the black bg → white, then shift hue to pink family */
  filter:
    invert(1)
    sepia(0.6)
    hue-rotate(280deg)
    saturate(2.5)
    brightness(1.5)
    contrast(0.85)
    opacity(0.82);
}

/* ── Card ────────────────────────────────────────────────────────────────── */
.card-wrap {
  position: relative;
  width: 90%;
}
.card-aurora-layer {
  position: absolute;
  inset: 0;
  border-radius: var(--radius);
  background: #FEF2F8;
  background-image:
    radial-gradient(ellipse at 20% 20%, rgba(255,210,235,0.9) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(230,100,160,0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 60% 10%, rgba(245,190,235,0.55) 0%, transparent 45%),
    radial-gradient(ellipse at 10% 80%, rgba(255,225,242,0.7) 0%, transparent 45%);
  background-size: 200% 200%;
  animation: aurora-shift 12s ease-in-out infinite;
  z-index: 0;
  pointer-events: none;
}
.card {
  position: relative;
  z-index: 1;
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(32px) saturate(1.6);
  -webkit-backdrop-filter: blur(32px) saturate(1.6);
  border-radius: var(--radius);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    0 12px 40px rgba(212, 39, 108, 0.15),
    0 2px 8px   rgba(212, 39, 108, 0.08),
    inset 0  1px 0 rgba(255, 255, 255, 0.90),
    inset 0 -1px 0 rgba(255, 255, 255, 0.40),
    inset  1px 0 0 rgba(255, 255, 255, 0.55),
    inset -1px 0 0 rgba(255, 255, 255, 0.55);
  padding: 30px 24px 24px;
}
.card-title    { font-family: 'Playfair Display', Georgia, serif; font-size: 21px; color: var(--text); margin-bottom: 5px; }

/* ── Register: frozen header + scrolling fields ───────────────────────────── */
.reg-shell {
  display: flex; flex-direction: column;
  flex: 1; min-height: 0;
  position: relative;
}
.reg-header {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(212, 39, 108, 0.10);
}
.reg-header .back-btn { margin-bottom: 0; flex-shrink: 0; }
.reg-header .card-title { margin-bottom: 0; }
.reg-scroll {
  flex: 1; min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-top: 16px;
  scroll-behavior: smooth;
  scrollbar-width: none;           /* Firefox — hide native scrollbar */
  -ms-overflow-style: none;
}
.reg-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; } /* WebKit */
.reg-toggle { margin-top: 18px; }

/* Scroll-down cue — circular glass button, appears while more content is below */
.scroll-cue {
  position: absolute;
  left: 50%; bottom: 6px; margin-left: -20px;
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px) saturate(1.4);
  -webkit-backdrop-filter: blur(10px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 14px rgba(212, 39, 108, 0.28);
  color: var(--primary);
  cursor: pointer;
  opacity: 0; pointer-events: none;
  transform: translateY(4px);
  transition: opacity .25s ease, transform .25s ease;
  z-index: 5;
}
.scroll-cue.show { opacity: 1; pointer-events: auto; transform: translateY(0); }
.scroll-cue.show svg { animation: cue-bounce 1.4s ease-in-out infinite; }
@keyframes cue-bounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(3px); }
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px; height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(212, 39, 108, 0.08);
  color: var(--primary);
  cursor: pointer;
  margin-bottom: 14px;
  transition: background 0.15s;
}
.back-btn:hover { background: rgba(212, 39, 108, 0.14); }
.card-subtitle { font-size: 13.5px; color: var(--text-muted); margin-bottom: 22px; line-height: 1.5; }

/* ── Alert ───────────────────────────────────────────────────────────────── */
.alert { padding: 11px 14px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 18px; line-height: 1.5; }
.alert-error   { background: #FEF0EE; color: var(--error);   border: 1px solid #F5C6C2; }
.alert-success { background: #EEF7F2; color: var(--success); border: 1px solid #B8DEC8; }

/* ── Form ────────────────────────────────────────────────────────────────── */
.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 6px; }
.optional { font-size: 11px; color: var(--text-muted); font-weight: 400; margin-left: 4px; }
.input-wrap { position: relative; }

input, select {
  width: 100%; padding: 13px 16px;
  border: 1px solid rgba(212,39,108,0.22);
  border-radius: var(--radius-sm);
  font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--text);
  background: #FEF5FA; outline: none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 3px rgba(212,39,108,0.05);
  letter-spacing: 0.05em;
  transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  -webkit-appearance: none; appearance: none;
  box-sizing: border-box;
}
input.glow-focus {
  border-color: var(--primary) !important;
  animation: input-glow 1.8s ease-out forwards;
}
@keyframes input-glow {
  0%   { box-shadow: 0 0 0 4px rgba(212,39,108,0.35); }
  100% { box-shadow: 0 0 0 3px rgba(212,39,108,0.11); }
}

input:focus, select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(212,39,108,0.11);
  background: #fff;
}
input::placeholder { color: #C5ABA8; }
input.err, select.err { border-color: var(--error); }
.field-error { font-size: 12px; color: var(--error); margin-top: 5px; }
.field-hint  { font-size: 12px; color: var(--text-muted); margin-top: 5px; }

.select-wrap { position: relative; }
.select-wrap::after {
  content: ''; position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  width: 0; height: 0;
  border-left: 5px solid transparent; border-right: 5px solid transparent;
  border-top: 5px solid var(--text-muted); pointer-events: none;
}

input.has-toggle { padding-right: 46px; }
.pass-toggle {
  position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; padding: 4px;
  color: rgba(170,31,86,0.5); display: flex; align-items: center;
  transition: color 0.3s;
}
.pass-toggle:not(.is-visible) {
  color: rgba(170,31,86,0.18);
}
.pass-toggle:not(.is-visible) .eye-pupil {
  animation: pupil-blink 2.8s ease-in-out infinite;
}
@keyframes pupil-blink {
  0%, 80%, 100% { opacity: 1; }
  88%           { opacity: 0; }
  93%           { opacity: 1; }
  97%           { opacity: 0; }
}

/* ── Keep me ─────────────────────────────────────────────────────────────── */
.keep-row {
  display: flex; align-items: center; gap: 10px;
  margin: 4px 0 14px; cursor: pointer; user-select: none;
}
.keep-check {
  width: 22px; height: 22px; border-radius: 6px;
  border: 1px solid rgba(212,39,108,0.22); background: #FEF5FA;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background 0.18s, border-color 0.18s;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 3px rgba(212,39,108,0.05);
}
.keep-check.checked { background: var(--primary); border-color: var(--primary); }
.keep-label { font-size: 13.5px; color: var(--text-muted); }

/* ── Button ──────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 15px 40px;
  background: linear-gradient(180deg,
    #E8408A 0%,
    #D4276C 45%,
    #B81F5A 100%);
  color: #fff; border: 1.5px solid transparent;
  border-radius: 50px;
  font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.04em; margin-top: 6px;
  box-shadow:
    0 4px 20px rgba(212,39,108,0.38),
    inset 0 1px 0 rgba(255,255,255,0.28),
    inset 0 -2px 0 rgba(0,0,0,0.12);
  position: relative; overflow: hidden;
  width: auto; min-width: 220px;
  align-self: center;
  transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s,
              background 0.22s, border-color 0.22s, color 0.22s,
              backdrop-filter 0.22s;
}
/* Centre the button within the card */
.btn-wrap { display: flex; justify-content: center; margin-top: 6px; }

/* Hover */
.btn:hover:not(:disabled) {
  opacity: 0.91;
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(212,39,108,0.45);
}

/* Glassy tap — icy pink glass */
.btn.glassy {
  transform: scale(0.97);
  background: linear-gradient(135deg,
    rgba(255,180,215,0.55) 0%,
    rgba(255,120,180,0.45) 100%);
  border-color: rgba(255,210,235,0.9);
  color: #fff;
  box-shadow:
    0 2px 24px rgba(212,39,108,0.18),
    inset 0 1.5px 0 rgba(255,255,255,0.85),
    inset 0 -1px 0 rgba(255,160,210,0.4);
  backdrop-filter: blur(16px) saturate(200%) brightness(1.15);
  -webkit-backdrop-filter: blur(16px) saturate(200%) brightness(1.15);
}
.btn.glassy::after { display: none; }

.btn:disabled { opacity: 0.58; cursor: not-allowed; }

.sparkle-icon {
  flex-shrink: 0;
  animation: sparkle-pulse 4s ease-in-out infinite;
  transform-origin: center;
}
@keyframes sparkle-pulse {
  0%, 100% { transform: scale(1) rotate(0deg); }
  40%       { transform: scale(1.08) rotate(4deg); }
  70%       { transform: scale(1.04) rotate(-2deg); }
}

.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.65s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Divider ─────────────────────────────────────────────────────────────── */
.divider {
  display: flex; align-items: center; gap: 10px;
  margin: 18px 0 16px; color: var(--text-muted); font-size: 12px;
}
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

/* ── Toggle link ─────────────────────────────────────────────────────────── */
.toggle-link { text-align: center; margin-top: 18px; font-size: 13.5px; color: var(--text-muted); }
.toggle-link a { color: var(--primary); font-weight: 600; cursor: pointer; text-decoration: none; }
.toggle-link a:hover { text-decoration: underline; }

/* ── Success ─────────────────────────────────────────────────────────────── */
.success-block { text-align: center; padding: 8px 0 4px; }
.success-icon {
  width: 60px; height: 60px; background: var(--primary-light); border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;
}

/* ── Help bubble ─────────────────────────────────────────────────────────── */
.help-bubble {
  position: fixed;
  bottom: 28px; right: 20px;
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(255,240,250,0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(212,39,108,0.22);
  box-shadow: 0 4px 16px rgba(212,39,108,0.15), inset 0 1px 0 rgba(255,255,255,0.7);
  color: var(--primary);
  font-size: 18px; font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.18s, box-shadow 0.18s;
  z-index: 200;
}
.help-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(212,39,108,0.25); }

/* Help sheet overrides */
.help-sheet { padding-top: 24px; }
.help-title {
  font-family: var(--font-display);
  font-size: 20px; color: var(--text);
  margin-bottom: 6px;
}
.help-sub {
  font-size: 13px; color: var(--text-muted);
  margin-bottom: 18px; line-height: 1.5;
}
.help-form { text-align: left; margin-bottom: 6px; }
.help-form .form-group { margin-bottom: 12px; }
.help-form label { display: block; font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 5px; }
.help-form input,
.help-form textarea {
  width: 100%; padding: 11px 14px;
  border: 1px solid rgba(212,39,108,0.22);
  border-radius: var(--radius-sm);
  font-family: var(--font-body); font-size: 14px; color: var(--text);
  background: #FEF5FA; outline: none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
  box-sizing: border-box;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.help-form input:focus,
.help-form textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(212,39,108,0.1);
  background: #fff;
}
.help-form input::placeholder,
.help-form textarea::placeholder { color: #C5ABA8; }
.help-form textarea { resize: none; }
.help-submit {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%;
}
.help-submit:disabled { opacity: 0.55; cursor: not-allowed; }
.help-success-icon { font-size: 48px; margin-bottom: 12px; }

/* ── Easter egg modal ────────────────────────────────────────────────────── */
.egg-overlay {
  position: fixed; inset: 0;
  background: rgba(44,24,16,0.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex; align-items: flex-end;
  z-index: 300;
}
.egg-sheet {
  width: 100%; max-width: 480px; margin: 0 auto;
  background: linear-gradient(160deg, #fff9fc 0%, #fff0f8 100%);
  border-radius: 28px 28px 0 0;
  padding: 28px 28px 40px;
  text-align: center;
  box-shadow: 0 -8px 40px rgba(212,39,108,0.18);
  border-top: 1px solid rgba(212,39,108,0.12);
}
.egg-figure {
  width: 80px; height: 80px;
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.egg-logo {
  width: 80px; height: 80px; object-fit: contain;
  filter:
    brightness(0) invert(1)
    drop-shadow(0 0 6px rgba(212,39,108,0.28))
    drop-shadow(0 0 14px rgba(212,39,108,0.14));
}
.egg-msg {
  font-family: var(--font-display);
  font-size: 20px; color: var(--text);
  line-height: 1.55; margin-bottom: 28px; padding: 0 8px;
}
.egg-close {
  background: rgba(255,240,250,0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--primary);
  border: 1px solid rgba(212,39,108,0.22);
  padding: 13px 36px; border-radius: 50px;
  font-family: var(--font-body); font-size: 15px; font-weight: 600;
  cursor: pointer; letter-spacing: 0.03em;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 12px rgba(212,39,108,0.1);
  transition: transform 0.15s, opacity 0.15s;
}
.egg-close:hover { opacity: 0.88; transform: translateY(-1px); }
.egg-enter-active { transition: opacity 0.25s ease; }
.egg-leave-active { transition: opacity 0.2s ease; }
.egg-enter-from, .egg-leave-to { opacity: 0; }
.egg-enter-active .egg-sheet { animation: sheet-up 0.32s cubic-bezier(0.34,1.46,0.64,1) both; }
.egg-leave-active .egg-sheet  { animation: sheet-down 0.2s ease-in both; }
@keyframes sheet-up   { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes sheet-down { from { transform: translateY(0); }    to { transform: translateY(100%); } }

/* ── Footer ──────────────────────────────────────────────────────────────── */
.footer { text-align: center; margin-top: 20px; font-size: 11.5px; color: var(--text-muted); }

/* ── Transitions ─────────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.fade-enter-from { opacity: 0; transform: translateY(10px); }
.fade-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>
