<template>
  <el-scrollbar v-loading="loading">
    <el-table :data="topicsData">
      <el-table-column prop="date" label="Date" width="140" />
      <el-table-column prop="topic" label="Topic" width="350" />
      <el-table-column prop="message" label="Message" />
    </el-table>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useMqttStore } from '@/store/MqttStore'

const mqttStore = useMqttStore()
const loading = ref(true)
const topicsData = ref([])

onMounted(async () => {
  await mqttStore.connect()
  loading.value = false
})

onBeforeRouteLeave(async () => {
  await mqttStore.disconnect()
})
</script>
