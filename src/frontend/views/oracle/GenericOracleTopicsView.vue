<template>
  <el-card
    class="full-width full-height"
    v-loading="loading"
    element-loading-text="Synchronizing..."
    shadow="never"
    style="border: none"
    body-class="flex-card-container"
  >
    <el-row>
      <el-button type="primary" :icon="RefreshLeft" @click="syncOracleData" style="align-self: flex-start">
        Sync Oracle
      </el-button>
      <el-button
        v-if="canPublish"
        type="primary"
        :icon="Position"
        @click="publishMessage"
        style="align-self: flex-start"
      >
        Publish
      </el-button>
    </el-row>
    <el-row v-if="canPublish" class="mt-4 mb-3">
      <el-text>Messages:</el-text>
      <el-tag
        @click="onChangeMessageSource('received')"
        :effect="messagesSource === 'received' ? 'dark' : 'plain'"
        type="info"
        class="clickable mx-3"
      >
        Received
      </el-tag>
      <el-tag
        @click="onChangeMessageSource('published')"
        class="clickable"
        type="info"
        :effect="messagesSource === 'published' ? 'dark' : 'plain'"
      >
        Published
      </el-tag>
    </el-row>
    <el-table
      :data="messagesSource === 'published' ? pubTableRowsData : subTableRowsData"
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
      <el-table-column label="Message" prop="message" min-width="450">
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
      <el-table-column v-if="messagesSource === 'received'" label="Status" prop="status" width="120">
        <template #default="scope">
          <el-tag v-if="scope.row.status" :type="statusSubTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-else-if="messagesSource === 'published'" label="Origin" prop="status" width="120">
        <template #default="scope">
          <el-tag v-if="scope.row.status" :type="statusPubTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Security" prop="security" width="130">
        <template #default="scope">
          <el-tag v-if="scope.row.security" :type="securityTagType(scope.row.security)">{{
            scope.row.security
          }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RefreshLeft, ArrowUpBold, ArrowDownBold, Position } from '@element-plus/icons-vue'
import { Buffer } from 'buffer'
import { IPublishPacket } from 'mqtt-packet'
import { MqttMessageSecurity, MqttMessageStatus, MqttMessageOrigin, MqttMessageType } from '@/types/mqtt'
import { OracleTemplateType } from '@/types/oracle'
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
  status?: MqttMessageStatus
  security: MqttMessageSecurity
}

interface GenericPubTopicData extends GenericTopicData {
  oracleId: bigint
}

interface GenericOracleTopicsViewProps {
  oracleId: bigint
  oracleTemplate: OracleTemplateType
}

interface GenericOracleTopicsEmits {
  (e: 'message:publish'): void
}

// TODO: remove, must be autogenerated
interface PublicationDto {
  topic: string
  message: Uint8Array | number[]
  timestamp: bigint
}

type MessagesSource = 'received' | 'published'

const emit = defineEmits<GenericOracleTopicsEmits>()
const props = defineProps<GenericOracleTopicsViewProps>()
const icpClient = useIcpClientStore()
const mqttClient = useMqttStore()
const loading = ref(true)
const oracle = ref<OracleDto>()
const canPublish = ref(false)
const messagesSource = ref<MessagesSource>('received')
const publications = ref<PublicationDto[]>([])
const pubTopicData = ref<Map<string, GenericPubTopicData>>(new Map())
const subscriptions = ref<SubscriptionDto[]>([])
const subTopicData = ref<Map<string, GenericTopicData>>(new Map())
const mqttTopicData = ref<Map<string, GenericTopicData>>(new Map())
const subTableRowsData = computed<GenericTableRowData[]>(() => {
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
const pubTableRowsData = computed<GenericTableRowData[]>(() => {
  const rows = [] as GenericTableRowData[]
  for (const [topic, data] of pubTopicData.value.entries()) {
    const row: GenericTableRowData = {
      id: topic,
      date: data.date.toLocaleString(),
      topic: topic,
      message: decodeIntoString(data.message, data.msgType),
      security: data.security,
      status: data.oracleId === oracle.value?.id ? 'actual' : 'foreign',
      showFullMessage: false
    }
    rows.push(row)
  }
  return rows
})

onUnmounted(async () => {
  await unsubscribeTopics()
})

watch(
  () => ({
    oracleId: props.oracleId,
    oracleTemplate: props.oracleTemplate
  }),
  async (current, prev) => {
    loading.value = true
    if (prev?.oracleId !== undefined) {
      await unsubscribeTopics()
    }
    subscriptions.value = []
    publications.value = []
    messagesSource.value = 'received'
    canPublish.value = current.oracleTemplate === 'generic'
    await getOracleData(current.oracleId)
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
  publications.value = []
  pubTopicData.value.clear()
  subscriptions.value = []
  subTopicData.value.clear()
  mqttTopicData.value.clear()
  // get subscriptions data
  for (const [name, msgType] of oracle.value!.subscriptions) {
    const subscription = await icpClient.actor?.getSubscription(name)
    if (!subscription?.length) {
      console.warn(`invalid data for topic: ${name}`)
      continue
    }
    let security: MqttMessageSecurity = 'unsigned'
    if (subscription[0].signed && subscription[0].verified) {
      security = 'broker-signed'
    } else if (subscription[0].signed && !subscription[0].verified) {
      security = 'invalid-sig'
    }
    subscriptions.value.push(subscription[0])
    subTopicData.value.set(subscription[0].topic, {
      date: subscription[0].timestamp ? new Date(Number(subscription[0].timestamp) / 1_000_000) : new Date(),
      message: Buffer.from(subscription[0].message),
      msgType: msgType as MqttMessageType,
      status: 'up-to-date',
      security
    })
  }
  // get publications data
  for (const topic of oracle.value!.publications) {
    const publication = await icpClient.actor?.getPublication(topic)
    if (!publication?.length) {
      console.warn(`invalid data for topic: ${topic}`)
      continue
    }
    publications.value.push(publication[0])
    pubTopicData.value.set(publication[0].topic, {
      date: publication[0].timestamp ? new Date(Number(publication[0].timestamp) / 1_000_000) : new Date(),
      message: Buffer.from(publication[0].message),
      msgType: publication[0].messageType as MqttMessageType,
      security: publication[0].signed ? 'icp-signed' : 'unsigned',
      oracleId: publication[0].oracleId
    })
  }
}

async function syncOracleData() {
  loading.value = true
  // @ts-expect-error
  const [successfullUpdates, totalCyclesUsed] = await icpClient.actor?.syncOracle(props.oracleId, true)
  console.log(`successfull updates: ${successfullUpdates}, total cycles used: ${totalCyclesUsed}`)
  await getOracleData(props.oracleId)
  loading.value = false
}

async function publishMessage() {
  emit('message:publish')
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
      security: null
    })
  }
}

function toggleMessageDisplay(row: GenericTableRowData) {
  row.showFullMessage = !row.showFullMessage
}

const tableRowClassName = ({ row }: { row: GenericTableRowData }) => {
  return row.isChild ? 'child-row' : ''
}

function onChangeMessageSource(source: MessagesSource) {
  messagesSource.value = source
}

function statusSubTagType(status: MqttMessageStatus) {
  switch (status) {
    case 'up-to-date':
      return 'success'
    case 'outdated':
      return 'danger'
    default:
      return ''
  }
}

function statusPubTagType(status: MqttMessageOrigin) {
  switch (status) {
    case 'actual':
      return 'success'
    case 'foreign':
      return 'warning'
    default:
      return ''
  }
}

function securityTagType(security: MqttMessageSecurity) {
  switch (security) {
    case 'unsigned':
      return 'warning'
    case 'icp-signed':
    case 'broker-signed':
    case 'device-signed':
      return 'success'
    case 'invalid-sig':
      return 'danger'
    default:
      return ''
  }
}
</script>

<style>
.el-table .child-row {
  --el-table-tr-bg-color: var(--uniot-color-background-light);
}

.clickable {
  cursor: pointer;
}
</style>
