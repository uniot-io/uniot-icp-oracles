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
        <el-col v-if="createOracle" :span="24" style="margin-bottom: 20px">
          <el-button type="primary" :icon="CirclePlus" @click="createDeviceOracle">Create Oracle</el-button>
        </el-col>
        <el-col :span="6">
          <span>Device Status:&nbsp;</span>
          <el-tag v-if="statusOnline" type="success">Online</el-tag>
          <el-tag v-else type="danger">Offline</el-tag>
        </el-col>
        <el-col :span="18">
          <span>Last Seen:&nbsp;</span>
          <el-tag type="info">{{ statusTimestamp }}</el-tag>
        </el-col>
      </el-row>
    </template>
    <div class="code-frame" :data-label="runtimeLabel">
      <highlightjs language="lisp" :code="formattedScript" />
    </div>
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
import { initLineNumbersOnLoad } from '@/utils/highlightjs-line-numbers'

interface UniotOracleDeviceViewProps {
  deviceId: bigint
  device: UniotDevice
  createOracle: boolean
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
const statusOnline = ref(false)
const statusTimestamp = ref(Date.now().toLocaleString())

const scriptParsed = ref('')
const formattedScript = ref(' ; no script code is available')
const runtimeLabel = ref('Lisp')

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

function setFormatedScript(script: string) {
  formattedScript.value = beautify(script)
  setTimeout(() => {
    initLineNumbersOnLoad()
  }, 10)
}

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
    statusOnline.value = status.online
    statusTimestamp.value = new Date(status.timestamp * 1_000).toLocaleString()
  }
}

function onScriptMessage(topic: string, message: Buffer, packet: IPublishPacket) {
  console.log('onScriptMessage')
  if (packet.retain) {
    const script = CBOR.decode(message)
    scriptParsed.value = JSON.stringify(script, null, 2)
    runtimeLabel.value = `${script.runtime}: ${script.version}`
    setFormatedScript(script.code)
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
  max-height: 55vh;
  background: var(--uniot-color-background-dark) !important;
  padding: 0 !important;
  padding-left: 10px !important;
}

.hljs-ln-numbers {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  text-align: center;
  color: #b4b8cb;
  border-right: 1px solid #b4b8cb;
  vertical-align: top;
  margin-right: 5px;
}

.hljs-ln td {
  padding-right: 5px !important;
  padding-left: 10px !important;
}

.hljs-ln-code {
  padding-left: 10px;
}
</style>
