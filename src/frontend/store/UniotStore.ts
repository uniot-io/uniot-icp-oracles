import 'regenerator-runtime/runtime'
import Ws from '@adonisjs/websocket-client'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

interface WsConnection {
  subscribe: (topic: string) => any
  close: () => void
}

export const useUniotStore = defineStore('uniotStore', () => {
  const wsConnection = ref<WsConnection>()
  const userHash = ref<string>('')
  const userId = computed(() => userHash.value)

  function connect(authToken: string | undefined = undefined): void {
    const url = import.meta.env.VITE_APP_UNIOT_API_URL
    const path = 'wsrt'

    if (authToken) {
      wsConnection.value = Ws(url, { path }).withJwtToken(authToken).connect()
    } else {
      wsConnection.value = Ws(url, { path }).connect()
    }
  }

  function disconnect(): void {
    if (wsConnection.value) {
      wsConnection.value.close()
    }
  }

  async function processIdentity(principal: string): Promise<void> {
    userHash.value = await new Promise((resolve, reject) => {
      if (!wsConnection.value) {
        return reject(new Error('WebSocket connection not initialized'))
      }

      const subscription = wsConnection.value.subscribe('guest')
      subscription.on('me:res', (data: any) => {
        subscription.close()
        resolve(data.hash)
      })
      subscription.emit('me', { providerId: principal })
    })
  }

  return {
    connect,
    disconnect,
    processIdentity,
    userId
  }
})