import { defineStore } from 'pinia'
import { computed, ref, watch, watchEffect } from 'vue'
import router from '@/router'
import { AuthClient } from '@dfinity/auth-client'
import { ActorSubclass, HttpAgent, Identity } from '@dfinity/agent'
import { createActor } from '@/../declarations/oracles_backend'
import { _SERVICE, OracleDto, UserDto } from '@/../declarations/oracles_backend/oracles_backend.did'

// Refer to documentation: https://agent-js.icp.xyz/
export const useIcpStore = defineStore('icpStore', () => {
  let authClient: AuthClient | undefined // can't be stored in ref...
  const authenticated = ref(false)
  const identity = ref<Identity>()
  const actor = ref<ActorSubclass<_SERVICE>>()
  const user = ref<UserDto>()
  const oracles = ref<OracleDto[]>([])
  const isAuthenticated = computed(() => authenticated.value)
  const principal = computed(() => {
    return {
      full: identity.value?.getPrincipal().toString() || '',
      trimmed: identity.value ? _trimmedPrincipal(identity.value) : ''
    }
  })

  watch(
    () => authenticated.value,
    async (success) => {
      if (success) {
        identity.value = authClient!.getIdentity()
        const agent = new HttpAgent({ identity: identity.value })
        actor.value = createActor(import.meta.env.VITE_APP_ORACLES_BACKEND_CANISTER_ID, { agent })
      }
    },
    { immediate: true }
  )

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

  async function currentUser() {
    await _getUser()
    await _getOracles()
    return {
      user: user.value,
      oracles: oracles.value
    }
  }

  async function _getUser() {
    user.value = await actor.value?.getMyUser()
  }

  async function _getOracles() {
    oracles.value = []
    for (const oracleId of user.value!.oracles) {
      const oracle = await actor.value?.getOracle(oracleId)
      if (oracle?.length) {
        oracles.value.push(oracle[0])
      }
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
    user.value = undefined
    oracles.value = []
    authenticated.value = false
    await router.push('login')
  }

  function _trimmedPrincipal(identity: Identity) {
    const principal = identity.getPrincipal().toString().split('-')
    return principal ? `${principal[0]}- ... -${principal[principal.length - 1]}` : ''
  }

  return {
    isAuthenticated,
    principal,
    actor,
    currentUser,
    login,
    logout
  }
})
