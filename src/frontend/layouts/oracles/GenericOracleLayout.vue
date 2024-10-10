<template>
  <el-container class="full-height un-main-inner" v-loading="loading" element-loading-text="Loading generic oracles...">
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
        :oracle-template="currentOracleTemplate"
        @message:publish="onPublishMessage"
      />
      <oracle-publish-view v-else-if="currentView === 'publish'" @submit="onPublish" />
    </template>
    <el-main class="un-empty-inner" v-else>
      <el-empty description="You have not created any IoT Oracles yet." />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { OraclePublication, OracleSettings } from '@/types/oracle'
import { useIcpClientStore } from '@/store/IcpClient'
import OracleMenu, { OracleMenuItem } from '@/components/oracle/OracleMenu.vue'
import GenericOracleCreateView from '@/views/oracle/GenericOracleCreateView.vue'
import GenericOracleTopicsView from '@/views/oracle/GenericOracleTopicsView.vue'
import OraclePublishView from '@/views/oracle/OraclePublishView.vue'
import { convertPublishPayloadByType } from '@/utils/msgDecoder'
import { OracleTemplateType } from '@/types/oracle'

type SelectedView = 'create' | 'oracle' | 'publish' | undefined
const createId = -1n

const icpClient = useIcpClientStore()
const loading = ref(true)
const currentView = ref<SelectedView>(undefined)
const currentOracleId = ref<bigint>(createId)
const oracles = ref<Array<OracleMenuItem>>([])
const currentOracleTemplate = ref<OracleTemplateType>('generic')

onMounted(async () => {
  loading.value = true
  const currentUser = await icpClient.currentUser()
  if (currentUser.oracles?.length) {
    oracles.value = currentUser.oracles.map(({ id, name, template }) => ({ id, name, template }))
    currentView.value = 'oracle'
    currentOracleId.value = currentUser.oracles[0].id
    currentOracleTemplate.value = currentUser.oracles[0].template as OracleTemplateType
  } else {
    currentView.value = 'create'
    currentOracleId.value = createId
    currentOracleTemplate.value = 'generic'
  }
  loading.value = false
})

async function onSelectOracle({ oracleId }: { oracleId: bigint }) {
  if (oracleId === createId) {
    currentView.value = 'create'
    currentOracleId.value = createId
  } else {
    currentView.value = 'oracle'
    currentOracleId.value = oracleId
    currentOracleTemplate.value = oracles.value.find((o) => o.id === oracleId)!.template as OracleTemplateType
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

async function onPublishMessage() {
  currentView.value = 'publish'
}

async function onPublish(data: OraclePublication) {
  loading.value = true
  try {
    const convertion = convertPublishPayloadByType(data.message, data.msgType)
    const res = await icpClient.actor?.publish(currentOracleId.value, [
      {
        topic: data.topic,
        msg: new Uint8Array(convertion.payload),
        msgType: convertion.type,
        signed: data.signed
      }
    ])
    if (res![0]) {
      ElMessage.success('Message successfully published')
    } else {
      ElMessage.error('The message was not published')
    }
  } catch (error) {
    console.warn(error)
  } finally {
    loading.value = false
    currentView.value = 'oracle'
  }
}
</script>
