import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ElementPlus from 'unplugin-element-plus/vite'

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
        // IMPORTANT: Do not link .scss files directly in the Vite config.
        // This will prepend the content to EVERY .scss file, leading to significant duplication
        // in the compiled output and a larger build size. Instead, use explicit @use or @import
        // in individual .scss files as needed.
      }
    }
  },
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/frontend')
    }
  },
  plugins: [
    vue(),
    // For future refactoring to use components on demand.
    ElementPlus({
      useSource: true
    })
  ],
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
