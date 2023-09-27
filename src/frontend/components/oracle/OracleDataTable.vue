<template>
  <el-scrollbar class="full-width" v-loading="props.loading">
    <el-table :data="props.data">
      <el-table-column prop="date" label="Date" width="100" />
      <el-table-column prop="topic" label="Topic" width="200" />
      <el-table-column prop="message" label="Message" />
      <el-table-column prop="status" label="Status" width="100" />
      <el-table-column prop="security" label="Security" width="100" />
    </el-table>
  </el-scrollbar>
</template>

<script setup lang="ts">
type TableProps = {
  loading: boolean
  data: Array<unknown>
}
const props = defineProps<TableProps>()
</script>
