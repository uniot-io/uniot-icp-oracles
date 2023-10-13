<template>
  <el-card
    class="full-width full-height"
    v-loading="loading"
    element-loading-text="Subscribing..."
    shadow="never"
    style="border: none"
  >
    <el-button type="primary" :icon="RefreshLeft" @click="syncOracleData">Sync Oracle</el-button>
    <el-table :data="tableRowsData" default-expand-all row-key="id">
      <el-table-column label="Date" prop="date" width="250" />
      <el-table-column label="Topic" prop="topic" width="250" />
      <el-table-column label="Message" prop="message" min-width="500" />
      <el-table-column label="Status" prop="status" width="150">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Security" prop="security" width="150">
        <template #default="scope">
          <el-tag :type="securityTagType(scope.row.security)">{{ scope.row.security }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RefreshLeft } from '@element-plus/icons-vue'
import { Buffer } from 'buffer'
import { IPublishPacket } from 'mqtt-packet'
import { MqttMessageSecurity, MqttMessageStatus, MqttMessageType } from '@/types/mqtt'
import { useIcpClientStore } from '@/store/IcpClient'
import { useMqttStore } from '@/store/MqttStore'
import { OracleDto, SubscriptionDto } from '@/../declarations/oracles_backend/oracles_backend.did'

interface TableRowData {
  id: string
  date: string
  topic: string
  message: string
  status: string
  security: string
}

interface GenericTableRowData extends TableRowData {
  children?: TableRowData[]
}

interface GenericTopicData {
  date: Date
  message: Buffer
  msgType: MqttMessageType
  status: MqttMessageStatus
  security: MqttMessageSecurity
}

interface GenericOracleTopicsViewProps {
  oracleId: bigint
}

const props = defineProps<GenericOracleTopicsViewProps>()
const icpClient = useIcpClientStore()
const mqttClient = useMqttStore()
const loading = ref(true)
const oracle = ref<OracleDto>()
const subscriptions = ref<SubscriptionDto[]>([])
const subTopicData = ref<Map<string, GenericTopicData>>(new Map())
const mqttTopicData = ref<Map<string, GenericTopicData>>(new Map())
const tableRowsData = computed<GenericTableRowData[]>(() => {
  const rows = [] as GenericTableRowData[]
  for (const [topic, data] of subTopicData.value.entries()) {
    const row: GenericTableRowData = {
      id: topic,
      date: data.date.toISOString(),
      topic: topic,
      message: data.message.toString('utf-8'),
      status: data.status,
      security: data.security
    }
    if (data.status === 'outdated') {
      const mqttData = mqttTopicData.value.get(topic)
      if (mqttData) {
        row.children = [
          {
            id: `mqtt-${topic}`,
            date: mqttData.date.toISOString(),
            topic: topic,
            message: mqttData.message.toString('utf-8'),
            status: mqttData.status,
            security: mqttData.security
          }
        ]
      }
    }
    rows.push(row)
  }
  return rows
})

onUnmounted(async () => {
  await unsubscribeTopics()
})

watch(
  () => props.oracleId,
  async (oracleId, prevOracleId) => {
    loading.value = true
    if (prevOracleId !== undefined) {
      await unsubscribeTopics()
    }
    subscriptions.value = []
    await getOracleData(oracleId)
    await subscribeTopics()
    loading.value = false
  },
  { immediate: true }
)

async function getOracleData(oracleId: bigint) {
  const oracleData = await icpClient.actor?.getOracle(oracleId)
  if (!oracleData?.length) {
    return
  }
  oracle.value = oracleData[0]
  subscriptions.value = []
  subTopicData.value.clear()
  mqttTopicData.value.clear()
  for (const [name, msgType] of oracle.value!.subscriptions) {
    const subscription = await icpClient.actor?.getSubscription(name)
    if (!subscription?.length) {
      console.warn(`invalid data for topic: ${name}`)
      continue
    }
    subscriptions.value.push(subscription[0])
    subTopicData.value.set(subscription[0].topic, {
      date: subscription[0].timestamp ? new Date(Number(subscription[0].timestamp) / 1_000_000) : new Date(),
      message: Buffer.from(subscription[0].message),
      msgType: msgType as MqttMessageType,
      status: 'up-to-date',
      security: 'unsecured'
    })
  }
}

async function syncOracleData() {
  loading.value = true
  const [successfullUpdates, totalCyclesUsed] = await icpClient.actor?.syncOracle(props.oracleId)
  console.log(`successfull updates: ${successfullUpdates}, total cycles used: ${totalCyclesUsed}`)
  await getOracleData(props.oracleId)
  loading.value = false
}

async function subscribeTopics() {
  for (const { topic } of subscriptions.value) {
    if (topic.search(/[+#]/) !== -1) {
      console.error(`can't subscribe to wildcard topic: ${topic}`)
    }
    await mqttClient
      .subscribe(topic, onMqttTopicMessage)
      .catch((error) => console.error(`failed to subscribe to topic: ${topic}, ${error}`))
  }
}

async function unsubscribeTopics() {
  for (const { topic } of subscriptions.value) {
    await mqttClient
      .unsubscribe(topic)
      .catch((error) => console.error(`failed to unsubscribe from topic: ${topic}, ${error}`))
  }
}

function onMqttTopicMessage(topic: string, message: Buffer, packet: IPublishPacket) {
  const sub = oracle.value?.subscriptions.find(([subTopic]) => subTopic === topic)
  if (!sub) {
    return
  }
  if (packet.retain) {
    const subMsg = subTopicData.value.get(topic)!
    const msgStatus = subMsg.message.compare(message) === 0 ? 'up-to-date' : 'outdated'
    subMsg.status = msgStatus
    mqttTopicData.value.set(topic, {
      date: new Date(),
      message: message,
      msgType: sub[1] as MqttMessageType,
      status: msgStatus,
      security: 'unsecured'
    })
  }
}

function statusTagType(status: MqttMessageStatus) {
  switch (status) {
    case 'up-to-date':
      return 'success'
    case 'outdated':
      return 'danger'
    default:
      return ''
  }
}

function securityTagType(security: MqttMessageSecurity) {
  switch (security) {
    case 'unsecured':
      return 'warning'
    default:
      return ''
  }
}
</script>
