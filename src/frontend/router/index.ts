import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useIcpAuthStore } from '@/store/IcpAuth'
import LoginView from '@/views/LoginView.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import GenericOracleView from '@/views/oracle/GenericOracleView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import EmptyView from '@/views/EmptyView.vue'

// legacy views
import LegacyLayout from '@/layouts/LegacyLayout.vue'
import LegacyIndexView from '@/views/legacy/LegacyIndexView.vue'
import LegacyAboutView from '@/views/legacy/LegacyAboutView.vue'
import LegacyExampleView from '@/views/legacy/LegacyExampleView.vue'

// NOTE: Avoid using dynamic imports (e.g., `component: async () => await import('@/views/Example.vue')`) in this application.
// The local development setup with the Internet Computer canister expects either a `canisterId` parameter in request URLs
// or a "Referer: http://127.0.0.1:4943/?canisterId=<VITE_APP_ORACLES_FRONTEND_CANISTER_ID>" header for asset requests.
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    redirect: 'generic-oracle',
    children: [
      { path: 'generic-oracle', component: GenericOracleView },
      { path: 'uniot-oracle', component: EmptyView },
      { path: 'other-oracle', component: EmptyView }
    ],
    beforeEnter: () => {
      const icpAuth = useIcpAuthStore()
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
    component: LegacyLayout,
    children: [
      { path: '', component: LegacyIndexView },
      { path: 'about', component: LegacyAboutView },
      { path: 'example', component: LegacyExampleView }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    // redirect: '/', // TODO: maybe permanently redirect to index?
    component: NotFoundView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: routes
})

export default router
