<template>
  <el-menu class="un-oracle-menu" :router="true" mode="vertical">
    <el-scrollbar>
      <el-menu-item>
        <el-icon><plus /></el-icon>
        <template #title>Create Oracle</template>
      </el-menu-item>
      <el-menu-item v-for="oracle in props.oracles" :key="oracle">
        <el-icon><data-board /></el-icon>
        <template #title>{{ oracle }}</template>
      </el-menu-item>
    </el-scrollbar>
  </el-menu>
</template>

<script setup lang="ts">
import { Plus, DataBoard } from '@element-plus/icons-vue'

type OracleMenuProps = {
  oracles: string[]
}

const props = defineProps<OracleMenuProps>()
</script>

<style scoped lang="scss">
.un-oracle-menu {
  max-width: 15rem;
}
</style>
