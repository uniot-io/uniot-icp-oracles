<template>
  <el-container style="height: 100vh">
    <div class="un-login-container">
      <el-image class="un-login-logo" :src="logo" fit="scale-down" />
      <el-button type="primary" size="large" @click="login()">Sign in with Internet Identity</el-button>
      <el-alert class="un-login-error" v-if="error" title="Something went wrong..." type="error">
        {{ errorMessage }}
      </el-alert>
    </div>
  </el-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logo from '@/assets/logo.svg'
import { useIcpStore } from '@/stores/IcpStore'

const route = useRoute()
const router = useRouter()
const icpClient = useIcpStore()
const error = ref(false)
const errorMessage = ref('')

watch(
  () => icpClient.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      router.replace(route.redirectedFrom || '/')
    }
  }
)

async function login() {
  try {
    error.value = false
    await icpClient.login()
  } catch (err) {
    console.error(err)
    error.value = true
    errorMessage.value = err instanceof Error ? err.message : (err as string)
  }
}
</script>

<style scoped lang="scss">
.un-login-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;

  .un-login-logo {
    width: 18rem;
  }

  .un-login-error {
    max-width: 600px;
  }

  * {
    margin-bottom: 2rem;
  }
}
</style>
