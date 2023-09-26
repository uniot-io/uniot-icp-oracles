import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { AuthClient } from '@dfinity/auth-client'
import { HttpAgent, Identity } from '@dfinity/agent'
import router from '@/router'

// Refer to documentation: https://agent-js.icp.xyz/
export const useIcpAuthStore = defineStore('icpAuthStore', () => {
  let authClient: AuthClient | undefined // can't be stored in ref...
  const authenticated = ref(false)
  const identity = ref<Identity>()
  const agent = ref<HttpAgent>()
  const principal = ref('')
  const isAuthenticated = computed(() => authenticated.value)

  watch(authenticated, async (success) => {
    if (success) {
      identity.value = authClient?.getIdentity()
      principal.value = (await identity.value!.getPrincipal()).toString()
      agent.value = new HttpAgent({ identity: identity.value })
    }
  })

  async function init(): Promise<void> {
    if (authClient === undefined) {
      authClient = await AuthClient.create({
        keyType: 'Ed25519',
        idleOptions: {
          // call logout & reload window if idle for <idleTimeout> milliseconds
          idleTimeout: 60 * 10 * 1000 // 10 minutes
        }
      })
    }
    authenticated.value = await authClient.isAuthenticated()
  }

  async function login(): Promise<void> {
    await init()
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
      authClient = undefined
      identity.value = undefined
      agent.value = undefined
      principal.value = ''
      authenticated.value = false
      await router.push('login')
    }
  }

  init().catch((error) => {
    console.error(error)
    throw error
  })

  return { isAuthenticated, login, logout, principal }
})
