<template>
  <el-card
    class="full-width full-height"
    v-loading="loading"
    element-loading-text="Synchronizing..."
    shadow="never"
    style="border: none"
    body-class="flex-card-container"
  >
    <el-button type="primary" :icon="RefreshLeft" @click="syncOracleData" style="align-self: flex-start">
      Sync Oracle
    </el-button>
    <el-table
      :data="tableRowsData"
      :row-class-name="tableRowClassName"
      default-expand-all
      row-key="id"
      style="flex: 1; overflow-y: auto"
      :indent="0"
    >
      <el-table-column width="23" />
      <el-table-column label="Topic" prop="topic" width="280">
        <template #default="scope">
          <template v-if="scope.row.topic">
            <el-text
              v-if="scope.row.showFullMessage || scope.row.topic.length <= 30"
              :size="scope.row.topic.length > 30 ? 'small' : 'default'"
            >
              {{ scope.row.topic }}
            </el-text>
            <template v-else>
              <el-tooltip class="box-item" effect="dark" :content="scope.row.topic" placement="top">
                <el-text>
                  {{ `${scope.row.topic.slice(0, 30)}...` }}
                </el-text>
              </el-tooltip>
            </template>
          </template>
          <el-tag v-else type="success">MQTT</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Message" prop="message" min-width="500">
        <template #default="scope">
          <el-text
            v-if="scope.row.showFullMessage || scope.row.message.length <= 82"
            :size="scope.row.message.length > 82 ? 'small' : 'default'"
            style="white-space: pre"
          >
            {{ scope.row.message }}
          </el-text>
          <el-text v-else>
            {{ `${scope.row.message.slice(0, 82)}...` }}
          </el-text>
        </template>
      </el-table-column>
      <el-table-column width="58">
        <template #default="scope">
          <el-button
            circle
            v-if="scope.row.message.length > 80"
            @click="toggleMessageDisplay(scope.row)"
            :icon="scope.row.showFullMessage ? ArrowUpBold : ArrowDownBold"
            size="small"
            style="margin-right: 10px"
          />
        </template>
      </el-table-column>
      <el-table-column label="Date" prop="date" width="200" />
      <el-table-column label="Status" prop="status" width="120">
        <template #default="scope">
          <el-tag v-if="scope.row.status" :type="statusTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Security" prop="security" width="120">
        <template #default="scope">
          <el-tag :type="securityTagType(scope.row.security)">{{ scope.row.security }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RefreshLeft, ArrowUpBold, ArrowDownBold } from '@element-plus/icons-vue'
import { Buffer } from 'buffer'
import { IPublishPacket } from 'mqtt-packet'
import { MqttMessageSecurity, MqttMessageStatus, MqttMessageType } from '@/types/mqtt'
import { useIcpClientStore } from '@/store/IcpClient'
import { useMqttStore } from '@/store/MqttStore'
import { OracleDto, SubscriptionDto } from '@/../declarations/oracles_backend/oracles_backend.did'
import { decodeIntoString } from '@/utils/msgDecoder'

interface TableRowData {
  id: string
  date: string
  topic?: string
  message: string
  status?: string
  security: string
  showFullMessage: boolean
  isChild?: boolean
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
      date: data.date.toLocaleString(),
      topic: topic,
      message: decodeIntoString(data.message, data.msgType),
      status: data.status,
      security: data.security,
      showFullMessage: false
    }
    if (data.status === 'outdated') {
      const mqttData = mqttTopicData.value.get(topic)
      if (mqttData) {
        row.children = [
          {
            id: `mqtt-${topic}`,
            date: mqttData.date.toLocaleString(),
            // topic: topic,
            message: decodeIntoString(mqttData.message, mqttData.msgType),
            // status: mqttData.status,
            security: mqttData.security,
            showFullMessage: false,
            isChild: true
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
  // @ts-expect-error
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
    try {
      await mqttClient.subscribe(topic, onMqttTopicMessage)
    } catch (error) {
      console.error(`failed to subscribe to topic: ${topic}, ${error}`)
    }
  }
}

async function unsubscribeTopics() {
  for (const { topic } of subscriptions.value) {
    try {
      await mqttClient.unsubscribe(topic)
    } catch (error) {
      console.error(`failed to unsubscribe from topic: ${topic}, ${error}`)
    }
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

function toggleMessageDisplay(row: GenericTableRowData) {
  row.showFullMessage = !row.showFullMessage
}

const tableRowClassName = ({ row }: { row: GenericTableRowData }) => {
  return row.isChild ? 'child-row' : ''
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

<style>
.el-table .child-row {
  --el-table-tr-bg-color: var(--uniot-color-background-light);
}
</style>
