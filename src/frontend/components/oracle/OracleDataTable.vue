<template>
  <el-scrollbar class="full-width" v-loading="props.loading">
    <el-table :data="props.data">
      <el-table-column
        v-for="col in props.columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
      />
    </el-table>
  </el-scrollbar>
</template>

<script setup lang="ts">
export type TableColumn = {
  prop: string
  label: string
  width?: string | number
}

type TableProps = {
  loading: boolean
  columns: TableColumn[]
  data: Array<unknown>
}
const props = defineProps<TableProps>()
</script>
