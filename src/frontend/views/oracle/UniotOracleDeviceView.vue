<template>
  <el-card
    class="full-width full-height"
    v-loading="loading"
    element-loading-text="Loading device data..."
    shadow="never"
    style="border: none"
  >
    <template #header>
      <el-row :gutter="20">
        <el-col :span="24" style="margin-bottom: 20px">
          <el-button type="primary" :icon="CirclePlus" @click="createDeviceOracle">Create Oracle</el-button>
        </el-col>
        <el-col :span="6">
          <span>Device Status:&nbsp;</span>
          <el-tag v-if="device.data.online" type="success">Online</el-tag>
          <el-tag v-else type="danger">Offline</el-tag>
        </el-col>
        <el-col :span="18">
          <span>Last message:&nbsp;</span>
          <el-tag type="info">{{ new Date(device.data.timestamp * 1_000).toISOString() }}</el-tag>
        </el-col>
      </el-row>
    </template>
    <highlightjs language="lisp" :code="formattedScript" />
  </el-card>
</template>

<script setup lang="ts">
import * as CBOR from 'cbor-web'
import { watch, ref, onUnmounted, computed, onMounted } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import { IPublishPacket } from 'mqtt-packet'
import { useIcpClientStore } from '@/store/IcpClient'
import { useMqttStore } from '@/store/MqttStore'
import { useUniotStore } from '@/store/UniotStore'
import { deviceScriptTopic, defaultDomain, deviceStatusTopic } from '@/utils/mqttTopics'
import { beautify } from '@/utils/lisp'
import { UniotDevice } from '@/types/uniot'
import { OracleTemplate } from '@/types/oracle'

interface UniotOracleDeviceViewProps {
  deviceId: bigint
  device: UniotDevice
}

type UniotDeviceEmits = {
  (e: 'created', item: { oracleId: bigint; device: UniotDevice }): void
}

const props = defineProps<UniotOracleDeviceViewProps>()
const emit = defineEmits<UniotDeviceEmits>()

const icpClient = useIcpClientStore()
const mqttClient = useMqttStore()
const uniotClient = useUniotStore()
const loading = ref(false)

const statusParsed = ref('')
const scriptParsed = ref('')
const formattedScript = ref('')

const statusTopic = computed(() => deviceStatusTopic(defaultDomain, uniotClient.userId, props.device.name))
const scriptTopic = computed(() => deviceScriptTopic(defaultDomain, uniotClient.userId, props.device.name))

watch(
  () => ({
    id: props.deviceId,
    device: props.device
  }),
  async (_, prevDevice) => {
    if (prevDevice) {
      await mqttClient.unsubscribe(deviceStatusTopic(defaultDomain, uniotClient.userId, prevDevice.device.name))
      await mqttClient.unsubscribe(deviceScriptTopic(defaultDomain, uniotClient.userId, prevDevice.device.name))
    }
  },
  { immediate: true }
)

onMounted(async () => {
  loading.value = true
  // workaround: wait while all topics will be unsubscribed
  await new Promise((resolve) => {
    setTimeout(resolve, 500)
  })
  await subscribeDeviceTopics()
  loading.value = false
})

onUnmounted(async () => {
  await mqttClient.unsubscribe(statusTopic.value)
  await mqttClient.unsubscribe(scriptTopic.value)
})

async function subscribeDeviceTopics() {
  try {
    await mqttClient.subscribe(statusTopic.value, onStatusMessage)
  } catch (error) {
    console.error(`failed to subscribe to topic: ${error}`)
  }

  try {
    await mqttClient.subscribe(scriptTopic.value, onScriptMessage)
  } catch (error) {
    console.error(`failed to subscribe to topic: ${error}`)
  }
}

function onStatusMessage(topic: string, message: Buffer, packet: IPublishPacket) {
  console.log('onStatusMessage')
  if (packet.retain) {
    const status = CBOR.decode(message)
    statusParsed.value = JSON.stringify(status, null, 2)
  }
}

function onScriptMessage(topic: string, message: Buffer, packet: IPublishPacket) {
  console.log('onScriptMessage')
  if (packet.retain) {
    const script = CBOR.decode(message)
    scriptParsed.value = JSON.stringify(script, null, 2)
    formattedScript.value = beautify(script.code)
  }
}

async function createDeviceOracle() {
  loading.value = true
  const topics = [statusTopic.value, scriptTopic.value].map((topic) => ({ topic, msgType: 'cbor' }))
  try {
    const newOracleId = await icpClient.actor?.createOracle(props.device.name, OracleTemplate.uniotDevice)
    await icpClient.actor?.subscribe(newOracleId!, topics)
    emit('created', { oracleId: newOracleId!, device: props.device })
  } catch (error) {
    console.error(error)
  }
  loading.value = false
}
</script>

<style lang="scss">
// can't be scoped
.hljs {
  max-height: 75vh;
}
</style>
