import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useIcpClientStore } from '@/store/IcpClient'
import MainLayout from '@/layouts/MainLayout.vue'
import GenericOracleLayout from '@/layouts/oracles/GenericOracleLayout.vue'
import UniotOracleLayout from '@/layouts/oracles/UniotOracleLayout.vue'
import CustomOracleLayout from '@/layouts/oracles/CustomOracleLayout.vue'
import LoginView from '@/views/LoginView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

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
      { path: 'generic-oracle', component: GenericOracleLayout },
      { path: 'uniot-oracle', component: UniotOracleLayout },
      { path: 'custom-oracle', component: CustomOracleLayout }
    ],
    beforeEnter: () => {
      if (!useIcpClientStore().isAuthenticated) {
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
  routes
})

export default router
