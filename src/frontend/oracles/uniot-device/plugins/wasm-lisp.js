import getModule from '@/oracles/uniot-device/utils/lisp/module'
import { setWasmInstance } from '@/oracles/uniot-device/utils/lisp'

export default {
  install() {
    getModule().then(setWasmInstance)
  }
}
