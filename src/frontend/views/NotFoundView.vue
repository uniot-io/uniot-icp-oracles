<template>
  <el-container style="height: 100vh">
    <el-header>
      <el-image style="width: 100px; height: 100%" :src="logo" fit="scale-down" />
    </el-header>
    <el-main>
      <el-row class="full-height" type="flex" justify="center" align="middle">
        <el-text> Not Found</el-text>
      </el-row>
    </el-main>
  </el-container>
</template>
<script setup lang="ts">
import logo from '@/assets/logo.svg'
</script>
