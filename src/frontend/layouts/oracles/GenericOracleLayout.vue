<template>
  <el-container class="full-height" v-loading="loading" element-loading-text="Loading generic oracles...">
    <oracle-menu
      :oracles="oracles"
      :create-id="createId"
      :default-selected-id="currentOracleId"
      @select="onSelectOracle"
    />
    <generic-oracle-create-view v-if="currentView === 'create'" @submit="onCreateOrUpdateOracle" />
    <generic-oracle-topics-view v-else-if="currentView === 'oracle'" :oracleId="currentOracleId" />
    <el-main v-else>
      <el-empty />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { OracleSettings } from '@/types/oracle'
import { useIcpClientStore } from '@/store/IcpClient'
import { useAdonisWebSocket } from '@/composables/useAdonisWebSocket'
import OracleMenu, { OracleMenuItem } from '@/components/oracle/OracleMenu.vue'
import GenericOracleCreateView from '@/views/oracle/GenericOracleCreateView.vue'
import GenericOracleTopicsView from '@/views/oracle/GenericOracleTopicsView.vue'

type SelectedView = 'create' | 'oracle' | undefined
const createId = -1n

const icpClient = useIcpClientStore()
const { wsConnection } = useAdonisWebSocket()
const loading = ref(true)
const currentView = ref<SelectedView>(undefined)
const currentOracleId = ref<bigint>(createId)
const oracles = ref<Array<OracleMenuItem>>([])

onMounted(async () => {
  loading.value = true
  const currentUser = await icpClient.currentUser()
  if (currentUser.oracles?.length) {
    oracles.value = currentUser.oracles.map(({ id, name }) => ({ id, name }))
    currentView.value = 'oracle'
    currentOracleId.value = currentUser.oracles[0].id
  } else {
    currentView.value = 'create'
    currentOracleId.value = createId
  }
  loading.value = false

  const subscription = wsConnection.value?.subscribe('guest')
  subscription.on('me:res', console.log)
  subscription.emit('me', { providerId: '5ghop-ontkl-wfxd3-gv4ag-nin5u-nqwqj-mb27h-zenwz-sr2vj-sgrdl-cqe' }) // TODO
})

async function onSelectOracle(oracle: bigint) {
  if (oracle === createId) {
    currentView.value = 'create'
    currentOracleId.value = createId
  } else {
    currentView.value = 'oracle'
    currentOracleId.value = oracle
  }
}

async function onCreateOrUpdateOracle(oracle: OracleSettings) {
  loading.value = true
  try {
    const newOracleId = await icpClient.actor?.createOracle(oracle.name, oracle.template)
    await icpClient.actor?.subscribe(newOracleId!, oracle.topics)
    const currentUser = await icpClient.currentUser()
    oracles.value = currentUser.oracles.map(({ id, name }) => ({ id, name }))
    currentView.value = 'oracle'
    currentOracleId.value = newOracleId!
  } catch (error) {
    console.error(error)
  }
  loading.value = false
}
</script>
