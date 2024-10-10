import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useIcpStore } from '@/stores/IcpStore'
import { MainLayout, CustomOracleLayout, GenericOracleLayout, UniotOracleLayout } from '@/layouts'
import { NotFoundView, LoginView } from '@/views'

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
      { path: 'custom-oracle', component: CustomOracleLayout },
      { path: 'uniot-oracle', component: UniotOracleLayout }
    ],
    beforeEnter: () => {
      if (!useIcpStore().isAuthenticated) {
        return 'login'
      }
    }
  },
  {
    path: '/login',
    component: LoginView
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
