import { defineStore } from 'pinia'
import { computed, ref, watch, watchEffect } from 'vue'
import { AuthClient } from '@dfinity/auth-client'
import { HttpAgent, Identity } from '@dfinity/agent'
import router from '@/router'

// Refer to documentation: https://agent-js.icp.xyz/
export const useIcpAuthStore = defineStore('icpAuthStore', () => {
  let authClient: AuthClient | undefined // can't be stored in ref...
  const authenticated = ref(false)
  const identity = ref<Identity>()
  const agent = ref<HttpAgent>()
  const principal = computed(() => identity.value?.getPrincipal().toString())
  const isAuthenticated = computed(() => authenticated.value)

  watch(authenticated, async (success) => {
    if (success) {
      identity.value = authClient?.getIdentity()
      agent.value = new HttpAgent({ identity: identity.value })
    }
  })

  watchEffect(async () => {
    await _init().catch((error) => {
      console.error(error)
      throw error
    })
  })

  async function login(): Promise<void> {
    await _init()
    if (authenticated.value) {
      return
    }

    authenticated.value = await new Promise((resolve, reject) => {
      authClient
        ?.login({
          identityProvider: import.meta.env.VITE_APP_II_URL,
          maxTimeToLive: BigInt(1 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 1 day in nanoseconds
          onSuccess: () => {
            resolve(true)
          },
          onError: (error) => {
            reject(error)
          },
          derivationOrigin: import.meta.env.VITE_APP_II_DERIVATION
        })
        .catch((error) => {
          console.error(error)
          throw error
        })
    })
  }

  async function logout(): Promise<void> {
    try {
      await authClient?.logout()
    } catch (error) {
      console.error(error)
    } finally {
      await _cleanup()
    }
  }

  async function _init(): Promise<void> {
    if (authClient === undefined) {
      authClient = await AuthClient.create({
        keyType: 'Ed25519',
        idleOptions: {
          // call logout & reload window if idle for <idleTimeout> milliseconds
          idleTimeout: 10 * 60 * 1000, // 10 minutes
          onIdle: _cleanup
        }
      })
    }
    authenticated.value = await authClient.isAuthenticated()
  }

  async function _cleanup() {
    authClient = undefined
    identity.value = undefined
    agent.value = undefined
    authenticated.value = false
    await router.push('login')
  }

  return { isAuthenticated, principal, login, logout }
})
