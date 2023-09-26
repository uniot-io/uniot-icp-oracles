import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as mqtt from 'mqtt/dist/mqtt.min'

export const useMqttStore = defineStore('mqttStore', () => {
  const client = ref<mqtt.MqttClient | undefined>()

  async function connect() {
    if (client.value?.connected) {
      return
    }

    if (client.value?.reconnecting) {
      await _waitForReconnection()
      return
    }

    try {
      client.value = await mqtt.connectAsync('wss://mqtt.uniot.io:8083/', {
        clientId: 'uniotx_' + Math.random().toString(16).substring(2, 10)
      })
    } catch (error) {
      console.error(error)
    }
  }

  async function disconnect() {
    if (!client.value || client.value?.disconnecting || client.value?.disconnected) {
      return
    }
    try {
      await client.value?.endAsync(true)
    } finally {
      client.value = undefined
    }
  }

  async function subscribeTopic() {}

  async function unsubscribeTopic() {}

  async function _waitForReconnection() {
    return new Promise<void>((resolve) => {
      function onConnect() {
        client.value?.removeListener('connect', onConnect)
        resolve()
      }
      client.value?.on('connect', onConnect)
    })
  }

  return { connect, disconnect, subscribe: subscribeTopic, unsubscribeTopic }
})
