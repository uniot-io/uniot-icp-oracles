import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as mqtt from 'mqtt/dist/mqtt.min'
import mqttMatch from 'mqtt-match'
import { IPublishPacket } from 'mqtt-packet'
import { Buffer } from 'buffer'
// import { defaultDomain } from '@/utils/mqttTopics'

export type MqttMessageCallback = (topic: string, data: Buffer, packet: IPublishPacket) => void

export const useMqttStore = defineStore('mqttStore', () => {
  const client = ref<mqtt.MqttClient | undefined>()
  const subscriptions = new Map<string, MqttMessageCallback>()

  async function connect() {
    if (client.value?.connected) {
      return
    }

    if (client.value?.reconnecting) {
      await _waitForReconnection()
      return
    }

    try {
      const url = import.meta.env.VITE_APP_UNIOT_MQTT_URL
      client.value = await mqtt.connectAsync(url, {
        clientId: 'uniot_oracle_' + Math.random().toString(16).substring(2, 10),
        clean: false
      })
      client.value.on('error', _onError)
      client.value.on('message', _onMessage)
    } catch (error) {
      console.error(error)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function disconnect() {
    if (!client.value || client.value?.disconnecting || client.value?.disconnected) {
      return
    }
    try {
      if (subscriptions.size) {
        await client.value?.unsubscribeAsync([...subscriptions.keys()])
      }
      await client.value?.endAsync(true)
    } finally {
      client.value?.removeListener('error', _onError)
      client.value?.removeListener('message', _onMessage)
      subscriptions.clear()
      client.value = undefined
    }
  }

  async function publish(topic: string, message: string | Buffer, opts?: mqtt.IClientPublishOptions) {
    await connect()
    await client.value?.publishAsync(topic, message, opts)
  }

  async function subscribe(topic: string, callback: MqttMessageCallback) {
    await connect()
    if (!subscriptions.has(topic)) {
      await client.value?.subscribeAsync(topic)
      subscriptions.set(topic, callback)
    }
  }

  async function unsubscribe(topic: string) {
    if (!subscriptions.has(topic)) {
      return
    }
    try {
      await client.value?.unsubscribeAsync(topic)
    } finally {
      subscriptions.delete(topic)
    }
  }

  async function _waitForReconnection() {
    return new Promise<void>((resolve) => {
      function onConnect() {
        client.value?.removeListener('connect', onConnect)
        resolve()
      }
      client.value?.on('connect', onConnect)
    })
  }

  function _onMessage(topic: string, message: Buffer, packet: IPublishPacket) {
    for (const [subTopic, callback] of subscriptions) {
      // TODO: how it worked earlier?
      // if (mqttMatch(subTopic, topic) || mqttMatch(`${defaultDomain}${subTopic}`, topic)) {
      if (mqttMatch(subTopic, topic)) {
        // callback(subTopic, message, packet)
        callback(topic, message, packet)
      }
    }
  }

  function _onError(error: Error) {
    console.error(`MQTT: ${error}`)
  }

  return { subscribe, unsubscribe, publish }
})
