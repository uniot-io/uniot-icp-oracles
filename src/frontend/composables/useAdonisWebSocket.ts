import 'regenerator-runtime/runtime'
import { ref } from 'vue'
import Ws from '@adonisjs/websocket-client'

const wsConnection = ref(null)

const wsConnect = (opts) => {
  const { url, path, token } = opts
  wsConnection.value = token
    ? Ws(url, { path }).withJwtToken(token).connect()
    : Ws(url, { path }).connect()
}

export function useAdonisWebSocket() {
  return {
    wsConnection,
    wsConnect
  }
}
