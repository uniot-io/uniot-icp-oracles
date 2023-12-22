<template>
  <el-card
    class="full-width full-height uniot-oracle-device-view-card"
    v-loading="loading"
    element-loading-text="Loading device data..."
    shadow="never"
  >
    <template #header>
      <el-row :gutter="20">
        <el-col :span="24" style="margin-bottom: 20px">
          <el-button v-if="createOracle" type="primary" :icon="CirclePlus" @click="createDeviceOracle">
            Create Oracle
          </el-button>
          <el-button v-if="emulation" type="danger" :icon="RemoveFilled" @click="terminate">Terminate</el-button>
          <el-button
            v-else
            type="success"
            :disabled="!scriptCode || !emulatorAvailable"
            :icon="CaretRight"
            @click="emulate"
          >
            Emulate
          </el-button>
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
    <el-row>
      <el-col :span="12">
        <emulator-view
          v-if="!loading"
          v-model:emulation="emulation"
          v-model:log="log"
          :device="device"
          :script="scriptCode"
          :available="emulatorAvailable"
        />
      </el-col>
      <el-col :span="12">
        <div class="code-frame" :data-label="runtimeLabel">
          <highlightjs language="lisp" :code="formattedScript" />
        </div>
      </el-col>
    </el-row>
    <template #footer>
      <div>
        <highlightjs v-if="!loading" ref="LoggerRef" language="json" :code="log" />
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import * as CBOR from 'cbor-web'
import { watch, ref, onUnmounted, computed, onMounted, nextTick } from 'vue'
import { CirclePlus, CaretRight, RemoveFilled } from '@element-plus/icons-vue'
import { IPublishPacket } from 'mqtt-packet'
import { useIcpClientStore } from '@/store/IcpClient'
import { useMqttStore } from '@/store/MqttStore'
import { useUniotStore } from '@/store/UniotStore'
import { deviceScriptTopic, defaultDomain, deviceStatusTopic } from '@/utils/mqttTopics'
import { beautify } from '@/utils/lisp/format'
import { UniotDevice, UniotGenericDevicePrimitives } from '@/types/uniot'
import { OracleTemplate } from '@/types/oracle'
import { initLineNumbersOnLoad } from '@/utils/highlightjs-line-numbers'
import EmulatorView from '@/components/emulator/EmulatorView.vue'

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
const scriptCode = ref('')
const formattedScript = ref(' ; no script code is available')
const runtimeLabel = ref('Lisp')

const log = ref('')
const emulation = ref(false)
const LoggerRef = ref()

const statusTopic = computed(() => deviceStatusTopic(defaultDomain, uniotClient.userId, props.device.name))
const scriptTopic = computed(() => deviceScriptTopic(defaultDomain, uniotClient.userId, props.device.name))

const emulatorAvailable = computed(() => {
  let available = true
  props.device.data.primitives.forEach((p) => {
    if (UniotGenericDevicePrimitives.includes(p)) {
      available = false
    }
  })
  return available
})

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

watch(
  log,
  () => {
    const logsContainer = document.querySelector('.uniot-oracle-device-view-card .el-card__footer')
    const logsCode = logsContainer?.getElementsByClassName('hljs')[0]
    logsCode!.scrollTop = logsCode!.scrollHeight
  },
  { flush: 'post' }
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

async function setFormatedScript(script: string) {
  formattedScript.value = beautify(script)
  await nextTick()
  initLineNumbersOnLoad()
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
  if (packet.retain) {
    const status = CBOR.decode(message)
    statusParsed.value = JSON.stringify(status, null, 2)
    statusOnline.value = status.online
    statusTimestamp.value = new Date(status.timestamp * 1_000).toLocaleString()
  }
}

function onScriptMessage(topic: string, message: Buffer, packet: IPublishPacket) {
  if (packet.retain) {
    const script = CBOR.decode(message)
    scriptParsed.value = JSON.stringify(script, null, 2)
    scriptCode.value = script.code
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

async function emulate() {
  if (!emulatorAvailable.value) return
  emulation.value = true
}

async function terminate() {
  emulation.value = false
}
</script>

<style lang="scss">
// can't be scoped
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

.hljs.lisp {
  max-height: 50vh;
  background: var(--uniot-color-background-dark) !important;
  padding: 0 !important;
}

.hljs.json {
  padding-left: 0px !important;
  max-height: 22vh;
}

.el-card.uniot-oracle-device-view-card {
  border: none;

  .el-card__footer {
    padding: 0;
    max-height: 25vh;

    pre {
      margin: 0;
    }
  }

  .el-card__body {
    padding-left: 0;
  }
}
</style>
