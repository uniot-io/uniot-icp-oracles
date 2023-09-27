<template>
  <el-container class="full-height">
    <oracle-menu :oracles="oracles" />
    <oracle-table-data :loading="loading" :data="topicsData" />
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElLoading } from 'element-plus'
import { useMqttStore } from '@/store/MqttStore'
import OracleMenu from '@/components/oracle/OracleMenu.vue'
import OracleTableData from '@/components/oracle/OracleDataTable.vue'

const mqttStore = useMqttStore()
const loading = ref(false)
const oracles = ref<string[]>(['first', 'second', 'third'])
const topicsData = reactive<string[]>([])

onMounted(async () => {
  const loadingInstance = ElLoading.service({ fullscreen: true, text: 'Loading data...' })
  await mqttStore.connect()
  loadingInstance.close()
})

onBeforeRouteLeave(async () => {
  await mqttStore.disconnect()
})
</script>
