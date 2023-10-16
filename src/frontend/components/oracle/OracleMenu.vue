<template>
  <el-menu class="un-oracle-menu" :default-active="selectedId" mode="vertical" @select="onSelect">
    <el-scrollbar>
      <el-menu-item v-if="props.withCreateItem" :index="props.createId!.toString(10)">
        <el-icon><plus /></el-icon>
        <template #title>Create Oracle</template>
      </el-menu-item>
      <el-menu-item-group v-if="props.oracles && props.oracles.length" title="Existing Oracles">
        <el-sub-menu v-if="grouping" v-for="template in [...groupedOracles.keys()]" :key="template" :index="template">
          <template #title>
            <span>{{ getOracleTemplateName(template) }}</span>
          </template>
          <el-menu-item
            v-for="oracle in [...(groupedOracles.get(template) || [])]"
            :key="oracle.id.toString(10)"
            :index="oracle.id.toString(10)"
          >
            <el-icon><connection /></el-icon>
            <span>{{ oracle.name }}</span>
          </el-menu-item>
        </el-sub-menu>
        <template v-else>
          <el-sub-menu
            v-if="views"
            v-for="oracle in props.oracles"
            :key="`${oracle.id.toString(10)}-parent`"
            :index="`${oracle.id.toString(10)}-parent`"
          >
            <template #title>
              <el-icon><connection /></el-icon>
              <span>{{ oracle.name }}</span>
            </template>
            <el-menu-item
              v-for="view in views"
              :key="`${oracle.id.toString(10)}+${view}`"
              :index="`${oracle.id.toString(10)}+${view}`"
            >
              <el-icon><data-board /></el-icon>
              <span>{{ view }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item
            v-else
            v-for="oracle in props.oracles"
            :key="oracle.id.toString(10)"
            :index="oracle.id.toString(10)"
          >
            <el-icon><connection /></el-icon>
            <span>{{ oracle.name }}</span>
          </el-menu-item>
        </template>
      </el-menu-item-group>
      <el-menu-item-group v-if="props.suggested && props.suggested.length" title="Suggested Oracles">
        <el-menu-item v-for="oracle in props.suggested" :key="oracle.id.toString(10)" :index="oracle.id.toString(10)">
          <el-icon><circle-plus /></el-icon>
          <span>{{ oracle.name }}</span>
        </el-menu-item>
      </el-menu-item-group>
    </el-scrollbar>
  </el-menu>
</template>

<script setup lang="ts">
import { getOracleTemplateName } from '@/types/oracle'
import { Plus, Connection, CirclePlus } from '@element-plus/icons-vue'
import { computed } from 'vue'

export type OracleMenuItem = {
  id: bigint
  name: string
  template: string
}

type OracleMenuProps = {
  defaultSelectedId: bigint
  withCreateItem: boolean
  createId?: bigint
  oracles: OracleMenuItem[]
  suggested?: OracleMenuItem[]
  grouping?: boolean
  views?: string[]
}

type OracleMenuEmits = {
  (e: 'select', item: { oracleId: bigint; view: string | undefined }): void
}

const props = defineProps<OracleMenuProps>()
const emit = defineEmits<OracleMenuEmits>()

const selectedId = computed(() => {
  if (props.oracles.some((o) => o.id === props.defaultSelectedId)) {
    if (!props.grouping && props.views) {
      return `${props.defaultSelectedId.toString(10)}+${props.views[0]}`
    }
  }
  return props.defaultSelectedId.toString(10)
})

const groupedOracles = computed(() => {
  return props.oracles.reduce((acc, obj) => {
    if (!acc.has(obj.template)) {
      acc.set(obj.template, [])
    }
    acc.get(obj.template)!.push(obj)
    return acc
  }, new Map<string, OracleMenuItem[]>())
})

function onSelect(index: string) {
  const [id, view] = index.split('+')
  emit('select', { oracleId: BigInt(id), view })
}
</script>

<style scoped lang="scss">
.un-oracle-menu {
  border: none;
  border-right: 1px solid var(--uniot-color-dividers);
  min-width: 15rem;
  max-width: 15rem;
}
</style>
