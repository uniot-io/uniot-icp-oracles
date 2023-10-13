<template>
  <el-container class="full-height" v-loading="loading" element-loading-text="Loading Uniot devices...">
    <oracle-menu
      v-if="!loading && oracleMenuItems.length"
      :with-create-item="false"
      :default-selected-id="currentDeviceId"
      :oracles="oracleMenuItems"
      @select="onSelectOracle"
    />
    <uniot-oracle-device-view v-if="!loading && oracleMenuItems.length" :device-id="currentDeviceId" device-name="" />
    <el-main v-if="!oracleMenuItems.length">
      <el-empty />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { Buffer } from 'buffer'
import { IPublishPacket } from 'mqtt-packet'
import * as CBOR from 'cbor-web'
import { useIcpClientStore } from '@/store/IcpClient'
import { useMqttStore } from '@/store/MqttStore'
import { useUniotStore } from '@/store/UniotStore'
import { deviceStatusTopic, defaultDomain, parseDeviceTopic } from '@/utils/mqttTopics'
import { OracleDto } from '@/../declarations/oracles_backend/oracles_backend.did'
import OracleMenu, { OracleMenuItem } from '@/components/oracle/OracleMenu.vue'
import UniotOracleDeviceView from '@/views/oracle/UniotOracleDeviceView.vue'

interface UniotDeviceData {
  id: bigint // bigint?
  online: 0 | 1
  creator: string
  timestamp: number
  // primitives: string[]
  // mqtt_size: number
  // d_in: 3
  // d_out: 3
  // a_in: 1
  // a_out: 3
}

interface UniotDevice {
  name: string
  data: UniotDeviceData
}

const icpClient = useIcpClientStore()
const mqttClient = useMqttStore()
const uniotClient = useUniotStore()
const loading = ref(true)
const currentDeviceId = ref(-1n)
const uniotDevices = ref<Map<string, UniotDevice>>(new Map())
const uniotOracles = ref<Array<OracleDto>>([])
const oracleMenuItems = computed(() => {
  const items: OracleMenuItem[] = []
  for (const device of uniotDevices.value.values()) {
    items.push({
      id: device.data.id,
      name: device.name
    })
  }
  return items
})

onMounted(async () => {
  loading.value = true
  const currentUser = await icpClient.currentUser()
  uniotOracles.value = currentUser.oracles.filter(({ template }) => template === 'uniot')
  await subscribeDeviceTopic()
  // wait device messages from mqtt
  await new Promise((resolve) => {
    setTimeout(resolve, 2500)
  })
  if (currentDeviceId.value === -1n && oracleMenuItems.value.length > 0) {
    currentDeviceId.value = oracleMenuItems.value[0].id
  }
  loading.value = false

  console.log('userId', uniotClient.userId)
})

onUnmounted(async () => {
  await mqttClient.unsubscribe(deviceStatusTopic(defaultDomain, icpClient.principal.full, '+'))
})

async function subscribeDeviceTopic() {
  await mqttClient
    .subscribe(deviceStatusTopic(defaultDomain, icpClient.principal.full, '+'), onDeviceMessage)
    .catch((error) => console.error(`failed to subscribe to topic: ${error}`))
}

function onDeviceMessage(topic: string, message: Buffer, packet: IPublishPacket) {
  if (packet.retain) {
    const { deviceId } = parseDeviceTopic(topic)
    uniotDevices.value.set(topic, { name: deviceId, data: CBOR.decode(message) })
  }
}

async function onSelectOracle(oracle: bigint) {
  currentDeviceId.value = oracle
}
</script>
