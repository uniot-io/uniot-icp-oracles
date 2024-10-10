import { App } from 'vue'
import hljsVuePlugin from '@highlightjs/vue-plugin'
import hljs from 'highlight.js/lib/core'
import lisp from 'highlight.js/lib/languages/lisp'
import json from 'highlight.js/lib/languages/json'

import 'highlight.js/styles/base16/github.css'

export default {
  install(app: App) {
    hljs.registerLanguage('lisp', lisp)
    hljs.registerLanguage('json', json)

    app.use(hljsVuePlugin)
  }
}
