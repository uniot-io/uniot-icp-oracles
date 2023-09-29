<template>
  <el-container class="full-height">
    <oracle-table-data :loading="loading" :columns="[]" :data="topicsData" />
  </el-container>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElLoading } from 'element-plus'
import { useMqttStore } from '@/store/MqttStore'
import OracleTableData from '@/components/oracle/OracleDataTable.vue'

const mqttClient = useMqttStore()
const loading = ref(false)
const topicsData = reactive<string[]>([])

let counter = 0

onMounted(async () => {
  const loadingInstance = ElLoading.service({ fullscreen: true, text: 'Subscribing topics...' })
  await mqttClient.subscribe('test/event/alarm', (topic: string, message: Uint8Array) => {
    const id = counter++
    console.log(`[${id}]${topic}: ${message}`)
  })
  loadingInstance.close()
})

onBeforeUnmount(async () => {
  await mqttClient.unsubscribe('test/event/alarm')
})
</script>
