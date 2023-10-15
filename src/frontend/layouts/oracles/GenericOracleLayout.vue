<template>
  <el-container
    class="full-height un-main-inner"
    v-loading="loading"
    element-loading-text="Loading generic oracles..."
  >
    <template v-if="currentView">
      <oracle-menu
        class="un-inner-left"
        with-create-item
        :oracles="oracles"
        :create-id="createId"
        :default-selected-id="currentOracleId"
        :grouping="true"
        @select="onSelectOracle"
      />
      <generic-oracle-create-view
        class="un-inner-right"
        v-if="currentView === 'create'"
        @submit="onCreateOrUpdateOracle"
      />
      <generic-oracle-topics-view
        class="un-inner-right"
        v-else-if="currentView === 'oracle'"
        :oracleId="currentOracleId"
      />
    </template>
    <el-main class="un-empty-inner" v-else>
      <el-empty description="You have not created any IoT Oracles yet." />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { OracleSettings } from '@/types/oracle'
import { useIcpClientStore } from '@/store/IcpClient'
import OracleMenu, { OracleMenuItem } from '@/components/oracle/OracleMenu.vue'
import GenericOracleCreateView from '@/views/oracle/GenericOracleCreateView.vue'
import GenericOracleTopicsView from '@/views/oracle/GenericOracleTopicsView.vue'

type SelectedView = 'create' | 'oracle' | undefined
const createId = -1n

const icpClient = useIcpClientStore()
const loading = ref(true)
const currentView = ref<SelectedView>(undefined)
const currentOracleId = ref<bigint>(createId)
const oracles = ref<Array<OracleMenuItem>>([])

onMounted(async () => {
  loading.value = true
  const currentUser = await icpClient.currentUser()
  if (currentUser.oracles?.length) {
    oracles.value = currentUser.oracles.map(({ id, name, template }) => ({ id, name, template }))
    currentView.value = 'oracle'
    currentOracleId.value = currentUser.oracles[0].id
  } else {
    currentView.value = 'create'
    currentOracleId.value = createId
  }
  loading.value = false
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
    oracles.value = currentUser.oracles.map(({ id, name, template }) => ({ id, name, template }))
    currentView.value = 'oracle'
    currentOracleId.value = newOracleId!
  } catch (error) {
    console.error(error)
  }
  loading.value = false
}
</script>
