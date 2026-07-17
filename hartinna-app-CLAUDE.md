# Hartinna Partner App (HPP)

## Project Overview
PWA for Hartinna SDN BHD's sales partners (agents) to browse products, manage cart, place orders, and view order history. Built with Vue 3 + Vite, deployed on Cloudflare Workers, backend on Supabase.

## Tech Stack
- Vue 3 (Composition API, `<script setup>`)
- Vue Router 4 (hash mode)
- Pinia (cart store at `src/stores/cart.js`)
- Supabase JS client (`src/lib/supabase.js`)
- vite-plugin-pwa (PWA with service worker)
- Cloudflare Workers (deployment via `wrangler`)

## Deployment
- Push to `main` → Cloudflare auto-deploys
- Live URL: `https://hna-app.hartinnapro.workers.dev`
- Git: `git add -A && git commit -m "..." && git push`

## Brand & Design System
- Primary color: `#D4276C` (hot pink) via CSS var `--primary`
- Font: Playfair Display (headings), system sans-serif (body)
- Border radius: `--radius` (cards), `--radius-xs` (buttons)
- All UI is mobile-first, max-width ~480px
- Pearl-white nav pill with metallic pink 3D gel active indicator
- Never use arbitrary Tailwind — all styles are scoped CSS in `.vue` files

## Project Structure
```
src/
  views/
    LoginView.vue       # Login, Register, Forgot email (single file, multi-panel)
    HomeView.vue        # Product listing with scroll reveal, hearts animation, cart button
    CartView.vue        # Cart items, qty stepper, remove animation, checkout
    OrdersView.vue      # Order history list
    OrderDetailView.vue # Single order detail
    ProfileView.vue     # Profile, password change, install PWA menu item
  components/
    AppNav.vue          # Sliding pill nav bar (Home/Cart/Orders/Profile)
    InstallBanner.vue   # PWA install bottom sheet (Android + iOS)
  composables/
    useInstallPrompt.js # PWA install detection + localStorage flag
    useSwipeNav.js      # Swipe navigation between tabs
  stores/
    cart.js             # Pinia cart store
  lib/
    supabase.js         # Supabase client
    session.js          # Auth session guard
    cache.js            # LocalStorage cache helpers
```

## Key Conventions
- Always use `reactive({})` for form state, `ref()` for primitives
- Cart store: `cart.addToCart(product, qty)` ADDS to existing qty (not overwrite)
- `localQtys` in HomeView is in-memory stepper state, min value is 1
- Scroll reveal: uses `revealedIds` reactive Set bound via `:class` — never classList.add()
- Flying hearts: inject `@keyframes` into `<head>` per heart, clean up after animation
- PWA install: tracked via `localStorage` key `hpp_pwa_installed`
- Page transitions: `--page-enter-dur: 0.25s` and `--page-enter-ease` CSS vars in App.vue
- Nav pill slide timing matches page transition via same CSS vars

## Active Tab Indicator
- Single `.pill-indicator` element slides via `translateX(calc(var(--active-idx) * 100%))`
- `activeIndex` is a `ref` updated via `requestAnimationFrame` on route change (syncs with Vue transition)
- 3D gel effect baked into `background` (radial + linear gradient layers)

## Do Not
- Do not use Tailwind classes
- Do not install new npm packages without checking first
- Do not use `classList.add/remove` for Vue-reactive state
- Do not overwrite cart qty — always increment: `cart.getQty(id) + newQty`
- Do not allow qty below 1 in HomeView stepper
