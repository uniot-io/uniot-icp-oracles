<template>
  <el-scrollbar>
    <el-table :data="tableData">
      <el-table-column prop="date" label="Date" width="140" />
      <el-table-column prop="topic" label="Topic" width="350" />
      <el-table-column prop="message" label="Message" />
    </el-table>
  </el-scrollbar>
</template>

<style scoped></style>

<script setup lang="ts">
import { ref } from 'vue'

const item = {
  date: '2016-05-02',
  topic: 'UNIOT/users/123qwer/devices/74gh294/script',
  message: "(task 30 300 ' (list (device_write 0 (= (% #t_pass 2) 0))))"
}
const tableData = ref(Array.from({ length: 20 }).fill(item))
</script>
