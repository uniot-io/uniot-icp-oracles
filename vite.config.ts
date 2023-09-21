import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { resolve } from 'path'

const DFX_NETWORK = process.env.DFX_NETWORK || 'local'

function initEnv() {
  let localCanisters, prodCanisters

  try {
    localCanisters = require(path.resolve('.dfx', 'local', 'canister_ids.json'))
  } catch (error) {
    console.log('No local canister_ids.json found.')
  }

  try {
    prodCanisters = require(path.resolve('canister_ids.json'))
  } catch (error) {
    console.log('No production canister_ids.json found.')
  }

  const canisters = DFX_NETWORK === 'local' ? localCanisters : prodCanisters

  for (const canister in canisters) {
    process.env['VITE_APP_' + canister.toUpperCase() + '_CANISTER_ID'] = canisters[canister][DFX_NETWORK]
  }

  process.env['VITE_APP_II_URL'] =
    DFX_NETWORK === 'local'
      ? `http://localhost:4943/?canisterId=${canisters['internet_identity'][DFX_NETWORK]}`
      : `https://identity.ic0.app`
  process.env['VITE_APP_II_DERIVATION'] =
    DFX_NETWORK === 'local'
      ? 'https://2vxsx-fae.icp0.io'
      : `https://${canisters['oracles_frontend'][DFX_NETWORK]}.icp0.io`

  console.log('Use the following .env vars to integrate Internet Identity:')
  console.log(` II_URL=${process.env['VITE_APP_II_URL']}`)
  console.log(` II_DERIVATION=${process.env['VITE_APP_II_DERIVATION']}\n`)

  console.log(process.env)
}

initEnv()

//https://vitejs.dev/config/
export default defineConfig({
  publicDir: './src/frontend/public',
  css: {
    preprocessorOptions: {
      scss: {
        // example : additionalData: `@import "./src/design/styles/variables";`
        // dont need include file extend .scss
        additionalData: `@import "./src/frontend/assets/scss/variable";
                         @import "./src/frontend/assets/scss/global";`
      }
    }
  },
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src/frontend')
    }
  },
  plugins: [vue()],
  define: {
    'process.env': process.env
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4943',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
