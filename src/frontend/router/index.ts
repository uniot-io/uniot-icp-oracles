import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/views/Index.vue'
import About from '@/views/About.vue'
import Example from '@/views/Example.vue'

// NOTE: Avoid using dynamic imports (e.g., `component: async () => await import('@/views/Example.vue')`) in this application.
// The local development setup with the Internet Computer canister expects either a `canisterId` parameter in request URLs
// or a "Referer: http://127.0.0.1:4943/?canisterId=<VITE_APP_ORACLES_FRONTEND_CANISTER_ID>" header for asset requests.
const routes = [
  {
    path: '/',
    name: 'Index',
    component: Index
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/example',
    name: 'Example',
    component: Example
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// router.beforeEach((to, from, next) => {
// 	next()
// })

export default router
