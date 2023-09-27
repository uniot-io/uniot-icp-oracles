<template>
  <el-container style="height: 100vh">
    <el-aside class="un-drawer">
      <el-image class="un-logo" :src="logo" fit="scale-down" />
      <el-menu
        class="un-menu"
        :router="true"
        :default-active="route.fullPath"
        text-color="#686f92"
        active-text-color="#09090c"
      >
        <el-scrollbar>
          <el-menu-item class="un-menu-item" index="/generic-oracle">
            <el-icon class="un-menu-icon"><document /></el-icon>
            <span class="un-menu-label">Generic IoT Oracle</span>
          </el-menu-item>
          <el-menu-item class="un-menu-item" index="/uniot-oracle">
            <el-icon class="un-menu-icon"><memo /></el-icon>
            <span class="un-menu-label">Uniot Device Oracle</span>
          </el-menu-item>
          <el-menu-item class="un-menu-item" index="/other-oracle">
            <el-icon class="un-menu-icon"><more /></el-icon>
            <span class="un-menu-label">Other IoT Oracle</span>
          </el-menu-item>
        </el-scrollbar>
      </el-menu>
      <el-row class="un-account">
        <el-col>
          <el-text size="large">Principal ID:&nbsp;</el-text>
          <el-tooltip :content="icpAuth.principal" placement="top">
            {{ trimmedPrincipal() }}
          </el-tooltip>
        </el-col>
        <el-col>
          <el-button class="full-width" @click="icpAuth.logout()">Logout</el-button>
        </el-col>
      </el-row>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import logo from '@/assets/logo.svg'
import { useRoute } from 'vue-router'
import { Document, Memo, More } from '@element-plus/icons-vue'
import { useIcpAuthStore } from '@/store/IcpAuth'

const route = useRoute()
const icpAuth = useIcpAuthStore()

function trimmedPrincipal() {
  if (icpAuth.isAuthenticated) {
    const principal = icpAuth.principal!.split('-')
    return `${principal[0]}-${principal[1]}...${principal[principal.length - 1]}`
  }
  return ''
}
</script>

<style lang="scss" scoped>
.un-drawer {
  background-color: var(--el-color-white);
  width: 18rem;
  display: flex;
  flex-direction: column;
  padding: 1rem 2rem;

  .un-logo {
    max-width: 100%;
  }

  .un-menu {
    flex: 1 0 auto;
    margin-top: 2rem;
    border: none;

    .un-menu-item {
      padding: 1rem;
      font-size: var(--el-font-size-medium);
      border-radius: var(--el-border-radius-base);

      &.is-active,
      &:active {
        background-color: var(--el-fill-color);

        .un-menu-icon {
          color: var(--el-color-primary);
        }
      }

      &:hover {
        background-color: var(--el-fill-color);
      }

      .un-menu-icon {
        font-size: 2rem;
      }

      .un-menu-label {
        padding-left: 1rem;
      }
    }
  }

  .un-account {
    * {
      margin-top: 0.5rem;
    }
    margin-top: 1rem;
  }
}
</style>
