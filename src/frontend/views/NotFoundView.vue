<template>
  <el-container style="height: 100vh">
    <div class="un-notfound-container">
      <el-image class="un-notfound-logo" :src="logo" fit="scale-down" />
      <el-text class="un-notfound-message"> Not Found</el-text>
    </div>
  </el-container>
</template>

<script setup lang="ts">
import logo from '@/assets/logo.svg'
</script>

<style scoped lang="scss">
.un-notfound-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;

  .un-notfound-logo {
    width: 18rem;
  }

  .un-notfound-message {
    margin: 2rem;
    font-size: 1.5rem;
  }
}
</style>
