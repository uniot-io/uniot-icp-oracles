<template>
  <el-container class="layout-container-demo" style="height: 100vh">
    <el-aside width="200px">
      <el-container style="height: 100vh">
        <el-header>
          <el-image style="width: 100px; height: 100%" :src="logo" fit="scale-down" />
        </el-header>
        <el-main>
          <el-scrollbar>
            <el-menu default-active="1">
              <el-menu-item index="1">
                <el-icon><document /></el-icon>
                <span>Generic IoT Oracle</span>
              </el-menu-item>
              <el-menu-item index="2">
                <el-icon><memo /></el-icon>
                <span>Uniot Device Oracle</span>
              </el-menu-item>
              <el-menu-item index="3">
                <el-icon><more /></el-icon>
                <span>Other IoT Oracle</span>
              </el-menu-item>
            </el-menu>
          </el-scrollbar>
        </el-main>
        <el-footer>
          <el-button size="large" :icon="User">Login</el-button>
        </el-footer>
      </el-container>
    </el-aside>

    <el-container>
      <el-aside width="200px">
        <el-scrollbar>
          <el-menu
            :router="true"
            default-active="/legacy"
            active-text-color="#ffd04b"
            background-color="#545c64"
            text-color="#fff"
          >
            <el-menu-item index="/legacy">
              <span>First Oracle</span>
            </el-menu-item>
            <el-menu-item index="/legacy/about">
              <span>Second Oracle</span>
            </el-menu-item>
            <el-menu-item index="/legacy/example">
              <span>Third Oracle</span>
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </el-aside>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { Document, User, More, Memo } from '@element-plus/icons-vue'
import logo from '@/assets/logo.svg'
</script>

<style scoped>
.layout-container-demo .el-header {
  position: relative;
  background-color: var(--el-color-primary-light-7);
  color: var(--el-text-color-primary);
}
.layout-container-demo .el-aside {
  color: var(--el-text-color-primary);
  background: var(--el-color-primary-light-8);
}
.layout-container-demo .el-menu {
  border-right: none;
}
.layout-container-demo .el-main {
  padding: 0;
}
.layout-container-demo .toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  right: 20px;
}
</style>
