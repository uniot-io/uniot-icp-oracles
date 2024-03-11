import './global'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import hljs from 'highlight.js/lib/core'
import lisp from 'highlight.js/lib/languages/lisp'
import json from 'highlight.js/lib/languages/json'
import hljsVuePlugin from '@highlightjs/vue-plugin'
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
import App from '@/App.vue'
import router from './router'
import '@/plugins/wasm-lisp'
import '@/assets/scss/index.scss'
import 'highlight.js/styles/base16/github.css'

hljs.registerLanguage('lisp', lisp)
hljs.registerLanguage('json', json)

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(hljsVuePlugin)
app.use(createPinia())
app.use(router)
app.use(VueMonacoEditorPlugin, {
  paths: { vs: 'https://ddnt2-iiaaa-aaaan-qeceq-cai.icp0.io/monaco-editor/min/vs' }
})
app.mount('#app')
