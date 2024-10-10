import './global'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
import App from '@/App.vue'
import router from '@/router'

import ElementPlus from '@/plugins/elementPlus'
import WasmLisp from '@/oracles/uniot-device/plugins/wasm-lisp'
import hljs from '@/oracles/uniot-device/plugins/hljs'

import '@/assets/scss/index.scss'

const app = createApp(App)
app.use(ElementPlus)
app.use(createPinia())
app.use(router)
app.use(VueMonacoEditorPlugin, {
  paths: { vs: 'https://ddnt2-iiaaa-aaaan-qeceq-cai.icp0.io/monaco-editor/min/vs' }
})

app.use(hljs)
app.use(WasmLisp)

app.mount('#app')
