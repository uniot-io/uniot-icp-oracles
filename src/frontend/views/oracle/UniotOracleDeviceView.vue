<template>
  <el-card
    class="full-width full-height"
    v-loading="loading"
    element-loading-text="Loading device data..."
    shadow="never"
    style="border: none"
  >
    <el-button type="primary" :icon="CirclePlus" @click="createDeviceOracle">Create Oracle</el-button>
    <el-button type="primary" :icon="RefreshLeft" @click="syncDeviceOracleData">Sync Oracle</el-button>
  </el-card>
</template>

<script setup lang="ts">
import { watch, ref, onUnmounted } from 'vue'
import { CirclePlus, RefreshLeft } from '@element-plus/icons-vue'
import { useIcpClientStore } from '@/store/IcpClient'
import { useMqttStore } from '@/store/MqttStore'
import { deviceScriptTopic, defaultDomain } from '@/utils/mqttTopics'

interface UniotOracleDeviceViewProps {
  deviceId: bigint
  deviceName: string
}

const props = defineProps<UniotOracleDeviceViewProps>()
const icpClient = useIcpClientStore()
const mqttClient = useMqttStore()
const loading = ref(true)

watch(
  () => ({
    id: props.deviceId,
    name: props.deviceName
  }),
  async (device, prevDevice) => {
    if (prevDevice) {
      await mqttClient.unsubscribe(deviceScriptTopic(defaultDomain, icpClient.principal.full, prevDevice.name))
    }
  },
  { immediate: true }
)

onUnmounted(async () => {
  await mqttClient.unsubscribe(deviceScriptTopic(defaultDomain, icpClient.principal.full, props.deviceName))
})

async function createDeviceOracle() {
  return
}

async function syncDeviceOracleData() {
  return
}
</script>
