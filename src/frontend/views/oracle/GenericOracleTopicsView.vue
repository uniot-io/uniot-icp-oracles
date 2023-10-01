<template>
  <el-container class="full-height">
    <oracle-table-data :loading="props.loading" element-loading-text="Subscribing..." :columns="columns" :data="[]" />
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Buffer } from 'buffer'
import { MqttMessageSecurity, MqttMessageStatus, MqttMessageType } from '@/types/mqtt'
import OracleTableData, { TableColumn } from '@/components/oracle/OracleDataTable.vue'

export type GenericTopicData = {
  date: string
  message: Buffer
  messageType: MqttMessageType
  status: MqttMessageStatus
  security: MqttMessageSecurity
}

type GenericOracleTopicsViewProps = {
  loading: boolean
  data: Map<string, GenericTopicData>
}

const props = defineProps<GenericOracleTopicsViewProps>()
const columns = ref<TableColumn[]>([
  { label: 'Date', prop: 'date', width: 100 },
  { label: 'Topic', prop: 'topic', width: 250 },
  { label: 'Message', prop: 'message', width: 500 },
  { label: 'Status', prop: 'status', width: 100 },
  { label: 'Security', prop: 'security', width: 100 }
])
</script>
