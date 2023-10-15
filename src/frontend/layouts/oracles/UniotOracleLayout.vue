<template>
  <el-container class="full-height un-main-inner" v-loading="loading" element-loading-text="Loading Uniot devices...">
    <oracle-menu
      class="un-inner-left"
      v-if="existingOracles.length || suggestedOracles.length"
      :with-create-item="false"
      :default-selected-id="currentOracleId"
      :oracles="existingOracles"
      :suggested="suggestedOracles"
      @select="onSelectOracle"
      style="padding-top: 10px"
    />
    <generic-oracle-topics-view class="un-inner-right" v-if="isCurrentOracleExisted" :oracleId="currentOracleId" />
    <uniot-oracle-device-view
      class="un-inner-right"
      v-else
      v-if="!loading && suggestedOracles.length"
      :device-id="currentOracleId"
      :device="uniotDevices.get(currentOracleId)!"
    />
    <el-main class="un-empty-inner" v-if="!(existingOracles.length || suggestedOracles.length)">
      <el-empty description="Unfortunately, we were unable to obtain a list of your Uniot devices.">
        <el-text>
          Please make sure you are authorized on the Uniot Platform with your
          <br />
          Internet Identity and have at least one active device.
        </el-text>
      </el-empty>
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
import OracleMenu, { OracleMenuItem } from '@/components/oracle/OracleMenu.vue'
import UniotOracleDeviceView from '@/views/oracle/UniotOracleDeviceView.vue'
import GenericOracleTopicsView from '@/views/oracle/GenericOracleTopicsView.vue'
import { UniotDevice } from '@/types/uniot'
import { OracleTemplate } from '@/types/oracle'

const ZERO_ORACLE_ID = -1n
const icpClient = useIcpClientStore()
const mqttClient = useMqttStore()
const uniotClient = useUniotStore()

const loading = ref(true)
const uniotDevices = ref<Map<bigint, UniotDevice>>(new Map())
const deviceStatusWildTopic = computed(() => deviceStatusTopic(defaultDomain, uniotClient.userId, '+'))

const currentOracleId = ref(ZERO_ORACLE_ID)
const existingOracles = ref<Array<OracleMenuItem>>([])
const suggestedOracles = computed((): OracleMenuItem[] => {
  return Array.from(uniotDevices.value.values(), (device) => ({
    id: calcDeviceId(device.name),
    name: device.name,
    template: OracleTemplate.uniotDevice
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
      .map(({ id, name, template }) => ({ id, name, template }))
    if (currentOracleId.value === ZERO_ORACLE_ID && existingOracles.value.length) {
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
    if (existingOracles.value.some(({ name }) => name === deviceId)) {
      return
    }

    const intDeviceId = calcDeviceId(deviceId)
    uniotDevices.value.set(intDeviceId, { name: deviceId, data: CBOR.decode(message) })
    if (currentOracleId.value === ZERO_ORACLE_ID) {
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
