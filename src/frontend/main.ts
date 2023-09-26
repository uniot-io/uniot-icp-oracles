import { Buffer } from 'buffer'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from '@/App.vue'
import router from './router'

import '@/assets/scss/index.scss'

// @dfinity/agent requires this. Can be removed once it's fixed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).global = window

// Workaround for setting Buffer at a single and predictable place
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).Buffer = Buffer

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(createPinia())
app.use(router)
app.mount('#app')
