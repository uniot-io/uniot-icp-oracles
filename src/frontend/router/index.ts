import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import IndexView from '@/views/IndexView.vue'
import AboutView from '@/views/AboutView.vue'
import ExampleView from '@/views/ExampleView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import LegacyLayout from '@/layouts/LegacyLayout.vue'
import { useICPAuthStore } from '@/store/ICPAuth'
import LoginView from '@/views/LoginView.vue'

// NOTE: Avoid using dynamic imports (e.g., `component: async () => await import('@/views/Example.vue')`) in this application.
// The local development setup with the Internet Computer canister expects either a `canisterId` parameter in request URLs
// or a "Referer: http://127.0.0.1:4943/?canisterId=<VITE_APP_ORACLES_FRONTEND_CANISTER_ID>" header for asset requests.
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: IndexView },
      { path: 'about', component: AboutView },
      { path: 'example', component: ExampleView }
    ],
    beforeEnter: () => {
      const icpAuth = useICPAuthStore()
      if (!icpAuth.isAuthenticated) {
        return 'login'
      }
    }
  },
  {
    path: '/login',
    component: LoginView
  },
  {
    path: '/legacy',
    component: LegacyLayout
  },
  {
    path: '/:catchAll(.*)*',
    component: NotFoundView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: routes
})

// router.beforeEach((to, from, next) => {
// 	next()
// })

export default router
