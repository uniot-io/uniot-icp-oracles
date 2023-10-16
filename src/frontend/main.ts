import './global'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import hljs from 'highlight.js/lib/core'
import lisp from 'highlight.js/lib/languages/lisp'
import hljsVuePlugin from '@highlightjs/vue-plugin'
import App from '@/App.vue'
import router from './router'
hljs.registerLanguage('lisp', lisp)

import '@/assets/scss/index.scss'
import 'highlight.js/styles/base16/github.css'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(hljsVuePlugin)
app.use(createPinia())
app.use(router)
app.mount('#app')
