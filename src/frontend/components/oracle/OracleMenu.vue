<template>
  <el-menu
    class="un-oracle-menu"
    :default-active="props.defaultSelectedId.toString(10)"
    mode="vertical"
    @select="onSelect"
  >
    <el-scrollbar>
      <el-menu-item :index="props.createId.toString(10)">
        <el-icon><plus /></el-icon>
        <template #title>Create Oracle</template>
      </el-menu-item>
      <el-menu-item v-for="oracle in props.oracles" :key="oracle.id.toString(10)" :index="oracle.id.toString(10)">
        <el-icon><connection /></el-icon>
        <template #title>{{ oracle.name }}</template>
      </el-menu-item>
    </el-scrollbar>
  </el-menu>
</template>

<script setup lang="ts">
import { Plus, Connection } from '@element-plus/icons-vue'

export type OracleMenuItem = {
  id: bigint
  name: string
}

type OracleMenuProps = {
  defaultSelectedId: bigint
  createId: bigint
  oracles: OracleMenuItem[]
}

type OracleMenuEmits = {
  (e: 'select', item: bigint): void
}

const props = defineProps<OracleMenuProps>()
const emit = defineEmits<OracleMenuEmits>()

function onSelect(index: string) {
  emit('select', BigInt(index))
}
</script>

<style scoped lang="scss">
.un-oracle-menu {
  min-width: 15rem;
  max-width: 15rem;
}
</style>
