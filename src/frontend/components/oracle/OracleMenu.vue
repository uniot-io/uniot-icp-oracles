<template>
  <el-menu
    class="un-oracle-menu"
    :default-active="props.defaultSelectedId.toString(10)"
    mode="vertical"
    @select="onSelect"
  >
    <el-scrollbar>
      <el-menu-item v-if="props.withCreateItem" :index="props.createId!.toString(10)">
        <el-icon><plus /></el-icon>
        <template #title>Create Oracle</template>
      </el-menu-item>
      <el-menu-item-group v-if="props.oracles && props.oracles.length" title="Existing Oracles">
        <el-menu-item v-for="oracle in props.oracles" :key="oracle.id.toString(10)" :index="oracle.id.toString(10)">
          <el-icon><connection /></el-icon>
          <span>{{ oracle.name }}</span>
        </el-menu-item>
      </el-menu-item-group>
      <el-menu-item-group v-if="props.suggested && props.suggested.length" title="Suggested Oracles">
        <el-menu-item v-for="oracle in props.suggested" :key="oracle.id.toString(10)" :index="oracle.id.toString(10)">
          <el-icon><edit /></el-icon>
          <span>{{ oracle.name }}</span>
        </el-menu-item>
      </el-menu-item-group>
    </el-scrollbar>
  </el-menu>
</template>

<script setup lang="ts">
import { Plus, Connection, Edit } from '@element-plus/icons-vue'

export type OracleMenuItem = {
  id: bigint
  name: string
}

type OracleMenuProps = {
  defaultSelectedId: bigint
  withCreateItem: boolean
  createId?: bigint
  oracles: OracleMenuItem[]
  suggested?: OracleMenuItem[]
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
