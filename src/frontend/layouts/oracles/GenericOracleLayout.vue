<template>
  <el-container class="full-height" v-loading="loading" element-loading-text="Loading generic oracles...">
    <oracle-menu :oracles="oracleNames" :default-selected="selectedOracle?.name || ''" @select="onSelectOracle" />
    <generic-oracle-create-view v-if="visibleView === 'create'" @submit="onCreateOrUpdateOracle" />
    <generic-oracle-topics-view v-else-if="visibleView === 'oracle'" :loading="oracleLoading" :data="topicsData" />
    <el-main v-else><el-empty /></el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { IPublishPacket } from 'mqtt-packet'
import { OracleSettings, OracleTopicSettings } from '@/types/oracle'
import { icpOracleSettingsTopic } from '@/utils/topics'
import { useIcpAuthStore } from '@/store/IcpAuth'
import { useMqttStore } from '@/store/MqttStore'
import OracleMenu from '@/components/oracle/OracleMenu.vue'
import GenericOracleCreateView from '@/views/oracle/GenericOracleCreateView.vue'
import GenericOracleTopicsView, { GenericTopicData } from '@/views/oracle/GenericOracleTopicsView.vue'

type SelectedView = 'create' | 'oracle' | undefined

const icpAuth = useIcpAuthStore()
const mqttClient = useMqttStore()
const loading = ref(true)
const oracleLoading = ref(false)
const visibleView = ref<SelectedView>(undefined)
const selectedOracle = ref<OracleSettings | undefined>()
const oracles = ref(new Map<string, Map<string, OracleTopicSettings>>(new Map()))
const oracleSettingsTopic = computed(() => icpOracleSettingsTopic(icpAuth.principal, 'generic'))
const oracleNames = computed(() => [...oracles.value.keys()])
const topicsData = ref(new Map<string, GenericTopicData>())

onMounted(async () => {
  loading.value = true
  await mqttClient.subscribe(oracleSettingsTopic.value, onSettingData)
  await new Promise((resolve) => {
    setTimeout(() => {
      visibleView.value = oracles.value.size ? 'oracle' : 'create'
      changeSelectedOracle(oracles.value.keys().next().value)
      resolve(true)
    }, 2500) // 2500ms for loading latest retain message from mqtt if it exists
  })
  loading.value = false
})

onBeforeRouteLeave(async () => {
  if (selectedOracle.value) {
    await unsubscribeTopics(selectedOracle.value)
  }
  await mqttClient
    .unsubscribe(oracleSettingsTopic.value)
    .catch((error) => console.error(`failed to unsubscribe from topic: ${oracleSettingsTopic.value}, ${error}`))
})

watch(
  () => selectedOracle.value,
  async (selectedOracle, prevSelectedOracle) => {
    loading.value = true
    if (prevSelectedOracle) {
      await unsubscribeTopics(prevSelectedOracle)
    }
    if (selectedOracle) {
      await subscribeTopics(selectedOracle)
    }
    loading.value = false
  }
)

async function onSelectOracle(oracleName: string) {
  if (oracleName === 'create') {
    visibleView.value = 'create'
    selectedOracle.value = undefined
  } else {
    loading.value = true
    visibleView.value = 'oracle'
    await changeSelectedOracle(oracleName)
    loading.value = false
  }
}

async function changeSelectedOracle(oracleName: string) {
  if (!oracles.value.has(oracleName)) {
    selectedOracle.value = undefined
    return
  }
  const oracleSettings: OracleSettings = {
    name: oracleName,
    topics: []
  }
  for (const [topic, settings] of oracles.value.get(oracleName)!) {
    oracleSettings.topics.push({ name: topic, settings: settings })
  }
  selectedOracle.value = oracleSettings
}

function onSettingData(_: string, message: Buffer, packet?: IPublishPacket) {
  if (!packet?.retain) {
    return
  }
  try {
    selectedOracle.value = JSON.parse(message.toString()) as OracleSettings
  } catch (error) {
    console.error(error)
  }
}

function onTopicData(topic: string, message: Buffer, packet?: IPublishPacket) {
  if (!packet?.retain) {
    return
  }
  if (!selectedOracle.value) {
    return
  }
  const topicSettings = oracles.value.get(selectedOracle.value?.name)?.get(topic)
  if (!topicSettings) {
    console.warn(`${topic} topic settings not found`)
    return
  }
  topicsData.value.set(topic, {
    date: new Date().toISOString(),
    message: message,
    messageType: topicSettings.messageType,
    status: 'up-to-date',
    security: 'unsecured'
  })
}

async function onCreateOrUpdateOracle(oracle: OracleSettings) {
  loading.value = true

  try {
    const oracleTopics = new Map<string, OracleTopicSettings>()
    for (const topic of oracle.topics) {
      oracleTopics.set(topic.name, topic.settings)
    }
    oracles.value.set(oracle.name, oracleTopics)

    // update oracle in contract

    visibleView.value = 'oracle'
    selectedOracle.value = oracle
  } catch (error) {
    console.error(error)
  }
  loading.value = false
}

async function subscribeTopics(oracleSettings: OracleSettings) {
  for (const { name } of oracleSettings.topics) {
    await mqttClient.subscribe(name, onTopicData)
  }
}

async function unsubscribeTopics(oracleSettings: OracleSettings) {
  for (const { name } of oracleSettings.topics) {
    await mqttClient
      .unsubscribe(name)
      .catch((error) => console.error(`failed to unsubscribe from topic: ${name}, ${error}`))
  }
}
</script>
