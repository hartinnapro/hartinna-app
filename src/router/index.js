import { createRouter, createWebHistory } from 'vue-router'
import LoginView       from '@/views/LoginView.vue'
import HomeView        from '@/views/HomeView.vue'
import CartView        from '@/views/CartView.vue'
import OrdersView      from '@/views/OrdersView.vue'
import OrderDetailView from '@/views/OrderDetailView.vue'
import PaymentView     from '@/views/PaymentView.vue'
import ProfileView     from '@/views/ProfileView.vue'
import AuditView       from '@/views/AuditView.vue'

const routes = [
  { path: '/',          redirect: '/home' },
  { path: '/login',     component: LoginView },
  { path: '/home',      component: HomeView },
  { path: '/cart',      component: CartView },
  { path: '/orders',    component: OrdersView },
  { path: '/orders/:id',component: OrderDetailView },
  { path: '/payment',   component: PaymentView },
  { path: '/profile',   component: ProfileView },
  { path: '/audit',     component: AuditView },
  // Catch-all → home
  { path: '/:pathMatch(.*)*', redirect: '/home' }
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})
