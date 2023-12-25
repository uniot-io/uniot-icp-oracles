<template>
  <el-container class="full-height un-main-inner" v-loading="loading" element-loading-text="Loading Uniot devices...">
    <oracle-menu
      class="un-inner-left"
      v-if="existingOracles.size || suggestedOracles.length"
      :with-create-item="false"
      :default-selected-id="currentOracleId"
      :oracles="Array.from(existingOracles.values())"
      :suggested="suggestedOracles"
      :views="oracleViews"
      @select="onSelectOracle"
      style="padding-top: 10px"
    />
    <template v-if="isCurrentOracleExisted">
      <generic-oracle-topics-view v-if="selectedView === oracleViews[0]" :oracleId="currentOracleId" />
      <uniot-oracle-device-view
        v-else
        class="un-inner-right"
        :device-id="currentDeviceId"
        :device="uniotDevices.get(currentDeviceId)!"
        :create-oracle="false"
        @created="onOracleCreated"
      />
    </template>
    <uniot-oracle-device-view
      class="un-inner-right"
      v-else-if="suggestedOracles.length"
      :device-id="currentOracleId"
      :device="uniotDevices.get(currentOracleId)!"
      :create-oracle="true"
      @created="onOracleCreated"
    />
    <el-main class="un-empty-inner" v-if="!(existingOracles.size || suggestedOracles.length)">
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
import { IPublishPacket } from 'mqtt-packet'
import { useIcpClientStore } from '@/store/IcpClient'
import { useMqttStore } from '@/store/MqttStore'
import { useUniotStore } from '@/store/UniotStore'
import { deviceStatusTopic, defaultDomain, parseDeviceTopic } from '@/utils/mqttTopics'
import OracleMenu, { OracleMenuItem } from '@/components/oracle/OracleMenu.vue'
import UniotOracleDeviceView from '@/views/oracle/UniotOracleDeviceView.vue'
import GenericOracleTopicsView from '@/views/oracle/GenericOracleTopicsView.vue'
import { UniotDevice, UniotDeviceData } from '@/types/uniot'
import { OracleTemplate } from '@/types/oracle'
import { decodeIntoJSON } from '@/utils/msgDecoder'

const ZERO_ORACLE_ID = -1n
const icpClient = useIcpClientStore()
const mqttClient = useMqttStore()
const uniotClient = useUniotStore()

const loading = ref(true)
const oracleViews = ref(['Generic View', 'Device View'])
const selectedView = ref(oracleViews.value[0])

const uniotDevices = ref<Map<bigint, UniotDevice>>(new Map())
const deviceStatusWildTopic = computed(() => deviceStatusTopic(defaultDomain, uniotClient.userId, '+'))

const currentOracleId = ref(ZERO_ORACLE_ID)
const existingOracles = ref<Map<bigint, OracleMenuItem>>(new Map())
const suggestedOracles = computed((): OracleMenuItem[] => {
  return Array.from(uniotDevices.value.values(), (device) => ({
    id: calcDeviceId(device.name),
    name: device.name,
    template: OracleTemplate.uniotDevice
  })).filter(({ name }) => !Array.from(existingOracles.value.values()).some((oracle) => oracle.name === name))
})
const currentDeviceId = computed(() => {
  const deviceName = existingOracles.value.get(currentOracleId.value)?.name
  return deviceName ? calcDeviceId(deviceName) : ZERO_ORACLE_ID
})

const isCurrentOracleExisted = computed(() => {
  return existingOracles.value.has(currentOracleId.value)
})

onMounted(async () => {
  loading.value = true
  await loadUserOracles()
  await new Promise((resolve) => {
    setTimeout(resolve, 500)
  })
  await subscribeDeviceTopic()
  loading.value = false
})

onUnmounted(async () => {
  await mqttClient.unsubscribe(deviceStatusWildTopic.value)
})

async function loadUserOracles() {
  const currentUser = await icpClient.currentUser()
  if (currentUser.oracles?.length) {
    const oracles = currentUser.oracles
      .filter(({ template }) => template === OracleTemplate.uniotDevice)
      .map(({ id, name, template }) => ({ id, name, template }))
    existingOracles.value = new Map(oracles.map((oracle) => [oracle.id, oracle]))
    if (currentOracleId.value === ZERO_ORACLE_ID && existingOracles.value.size) {
      currentOracleId.value = existingOracles.value.keys().next().value
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
    const messageDecoded = decodeIntoJSON<UniotDeviceData>(message, 'CBOR')
    uniotDevices.value.set(intDeviceId, { name: deviceId, data: messageDecoded })
    if (currentOracleId.value === ZERO_ORACLE_ID) {
      currentOracleId.value = intDeviceId
    }
  }
}

async function onOracleCreated({ oracleId, device }: { oracleId: bigint; device: UniotDevice }) {
  existingOracles.value.set(oracleId, {
    id: oracleId,
    name: device.name,
    template: OracleTemplate.uniotDevice
  })
  currentOracleId.value = oracleId
}

async function onSelectOracle({ oracleId, view }: { oracleId: bigint; view: string | undefined }) {
  currentOracleId.value = oracleId
  selectedView.value = view ?? oracleViews.value[0]
}

function calcDeviceId(deviceId: string): bigint {
  return BigInt(`0x${deviceId}`)
}
</script>
