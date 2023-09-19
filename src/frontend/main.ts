import { Buffer } from 'buffer'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './assets/scss/global.css'

// @dfinity/agent requires this. Can be removed once it's fixed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).global = window

// Workaround for setting Buffer at a single and predictable place
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).Buffer = Buffer

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
