<template>
  <el-container class="full-height" v-loading="loading" element-loading-text="Loading Uniot devices...">
    <oracle-menu
      v-if="existingOracles.length || suggestedOracles.length"
      :with-create-item="false"
      :default-selected-id="currentOracleId"
      :oracles="existingOracles"
      :suggested="suggestedOracles"
      @select="onSelectOracle"
    />
    <generic-oracle-topics-view v-if="isCurrentOracleExisted" :oracleId="currentOracleId" />
    <uniot-oracle-device-view
      v-else
      v-if="!loading && suggestedOracles.length"
      :device-id="currentOracleId"
      :device="uniotDevices.get(currentOracleId)!"
    />
    <el-main v-if="!suggestedOracles.length">
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
import GenericOracleTopicsView from '@/views/oracle/GenericOracleTopicsView.vue'
import { UniotDevice } from '@/types/uniot'
import { OracleTemplate } from '@/types/oracle'
import { ca } from 'element-plus/es/locale'

const icpClient = useIcpClientStore()
const mqttClient = useMqttStore()
const uniotClient = useUniotStore()

const loading = ref(true)
const uniotDevices = ref<Map<bigint, UniotDevice>>(new Map())
const uniotOracles = ref<Array<OracleDto>>([])
const deviceStatusWildTopic = computed(() => deviceStatusTopic(defaultDomain, uniotClient.userId, '+'))

const currentOracleId = ref(0n)
const existingOracles = ref<Array<OracleMenuItem>>([])
const suggestedOracles = computed((): OracleMenuItem[] => {
  return Array.from(uniotDevices.value.values(), (device) => ({
    id: calcDeviceId(device.name),
    name: device.name
  }))
})

const isCurrentOracleExisted = computed(() => {
  return existingOracles.value.some(({ id }) => id === currentOracleId.value)
})

onMounted(async () => {
  loading.value = true
  await loadUserOracles()
  await subscribeDeviceTopic()
  // wait device messages from mqtt
  await new Promise((resolve) => {
    setTimeout(resolve, 500)
  })
  loading.value = false
})

onUnmounted(async () => {
  await mqttClient.unsubscribe(deviceStatusWildTopic.value)
})

async function loadUserOracles() {
  const currentUser = await icpClient.currentUser()
  if (currentUser.oracles?.length) {
    existingOracles.value = currentUser.oracles
      .filter(({ template }) => template === OracleTemplate.uniotDevice)
      .map(({ id, name }) => ({ id, name }))
    if (currentOracleId.value === 0n && existingOracles.value.length) {
      currentOracleId.value = existingOracles.value[0].id
    }
  }
}

async function subscribeDeviceTopic() {
  console.log(deviceStatusWildTopic.value)
  try {
    await mqttClient.subscribe(deviceStatusWildTopic.value, onDeviceMessage)
  } catch (error) {
    console.error(`failed to subscribe to topic: ${error}`)
  }
}

function onDeviceMessage(topic: string, message: Buffer, packet: IPublishPacket) {
  if (packet.retain) {
    const { deviceId } = parseDeviceTopic(topic)
    const intDeviceId = calcDeviceId(deviceId)
    uniotDevices.value.set(intDeviceId, { name: deviceId, data: CBOR.decode(message) })
    if (currentOracleId.value === 0n) {
      currentOracleId.value = intDeviceId
    }
  }
}

async function onSelectOracle(oracle: bigint) {
  currentOracleId.value = oracle
}

function calcDeviceId(deviceId: string): bigint {
  return BigInt(`0x${deviceId}`)
}
</script>
