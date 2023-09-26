import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { AuthClient } from '@dfinity/auth-client'
import { HttpAgent, Identity } from '@dfinity/agent'
import router from '@/router'

export const useIcpAuthStore = defineStore('icpAuthStore', () => {
  const authenticated = ref(false)
  let authClient: AuthClient | undefined = undefined // can't be stored in ref...
  const identity = ref<Identity>()
  const agent = ref<HttpAgent>()
  const principal = ref('')
  const isAuthenticated = computed(() => authenticated.value)

  async function login() {
    // create an auth client
    authClient = await AuthClient.create()
    // start the login process and wait for it to finish
    authenticated.value = await new Promise((resolve, reject) => {
      authClient?.login({
        identityProvider: import.meta.env.VITE_APP_II_URL,
        onSuccess: () => {
          resolve(true)
        },
        onError: (error) => {
          reject(error)
        },
        derivationOrigin: import.meta.env.VITE_APP_II_DERIVATION
      })
    })

    // At this point we're authenticated, and we can get the identity from the auth client:
    identity.value = authClient.getIdentity()
    // Using the identity obtained from the auth client, we can create an agent to interact with the IC.
    agent.value = new HttpAgent({ identity: identity.value })
    principal.value = (await agent.value!.getPrincipal()).toString()
  }

  async function logout() {
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

  return { isAuthenticated, login, logout, principal }
})
