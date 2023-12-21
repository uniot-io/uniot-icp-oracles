import getModule from '@/utils/lisp/module'
import { setWasmInstance } from '@/utils/lisp'

getModule().then(setWasmInstance)
