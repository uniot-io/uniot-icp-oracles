<template>
  <el-container class="full-height">
    <oracle-menu :oracles="oracles" :default-selected="selectedOracle" @select="onSelectOracle" />
    <generic-oracle-create-view v-if="selectedOracle === 'create'" />
    <generic-oracle-topics-view v-else />
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElLoading } from 'element-plus'
import { OracleParams } from '@/types/oracle'
import OracleMenu from '@/components/oracle/OracleMenu.vue'
import GenericOracleCreateView from '@/views/oracle/GenericOracleCreateView.vue'
import GenericOracleTopicsView from '@/views/oracle/GenericOracleTopicsView.vue'

const oracles = reactive<OracleParams[]>([])
const selectedOracle = ref<string>('')

onMounted(async () => {
  const loadingInstance = ElLoading.service({ fullscreen: true })
  loadingInstance.setText('Loading generic oracles...')
  oracles.push({ name: 'first', topics: [] })
  oracles.push({ name: 'second', topics: [] })
  oracles.push({ name: 'third', topics: [] })
  selectedOracle.value = oracles.length ? oracles[0].name : 'create'
  loadingInstance.close()
})

function onSelectOracle(oracle: string) {
  selectedOracle.value = oracle
}
</script>
