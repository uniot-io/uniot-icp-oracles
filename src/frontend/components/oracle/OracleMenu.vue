<template>
  <el-menu class="un-oracle-menu" :default-active="props.defaultSelected" mode="vertical" @select="onSelect">
    <el-scrollbar>
      <el-menu-item index="create">
        <el-icon><plus /></el-icon>
        <template #title>Create Oracle</template>
      </el-menu-item>
      <el-menu-item v-for="oracle in props.oracles" :key="oracle" :index="oracle">
        <el-icon><connection /></el-icon>
        <template #title>{{ oracle }}</template>
      </el-menu-item>
    </el-scrollbar>
  </el-menu>
</template>

<script setup lang="ts">
import { Plus, Connection } from '@element-plus/icons-vue'

type OracleMenuProps = {
  defaultSelected: string
  oracles: string[]
}

type OracleMenuEmits = {
  (e: 'select', item: string): void
}

const props = defineProps<OracleMenuProps>()
const emit = defineEmits<OracleMenuEmits>()

function onSelect(index: string) {
  emit('select', index)
}
</script>

<style scoped lang="scss">
.un-oracle-menu {
  min-width: 15rem;
  max-width: 15rem;
}
</style>
