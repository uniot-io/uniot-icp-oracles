const { program } = require('commander')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const CONFIG = {
  paths: {
    candid: {
      source: 'candid/assetstorage.did',
      destination: '.dfx/local/canisters/oracles_frontend/assetstorage.did'
    },
    motoko: {
      source: 'src/canister/Env.mo'
    },
    origins: {
      source: 'src/frontend/public/.well-known/ii-alternative-origins'
    }
  }
}

function loadEnv(mode) {
  const envFilePath = path.resolve(__dirname, `.env.${mode}`)
  if (fs.existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath })
    console.log(`Loaded environment variables from ${envFilePath}`)
  } else {
    console.error(`Environment file ${envFilePath} not found`)
    process.exit(1)
  }
}

function ensureDirExist(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

program
  .command('prepare')
  .description('Copy candid files to .dfx/local folder')
  .action(() => {
    const src = path.resolve(__dirname, CONFIG.paths.candid.source)
    const dest = path.resolve(__dirname, CONFIG.paths.candid.destination)
    ensureDirExist(path.dirname(dest))

    fs.copyFile(src, dest, (err) => {
      if (err) {
        console.error(`Error copying file: ${err}`)
        process.exit(1)
      }
      console.log(`File copied from ${src} to ${dest}`)
    })
  })

program
  .command('set-motoko-env')
  .description('Replace parameters in Env.mo file based on environment mode')
  .option('--mode <mode>', 'Environment mode (e.g., development, production, staging)', 'development')
  .action((cmd) => {
    const { mode } = cmd
    loadEnv(mode)

    const envMoFile = path.resolve(__dirname, CONFIG.paths.motoko.source)
    let fileContent = `module {
  public let BROKER_URL = "${process.env.BROKER_URL}";
  public let BROKER_PUB_KEY = "${process.env.BROKER_PUB_KEY}";
  public let SIGNER_KEY_TYPE = #${process.env.SIGNER_KEY_TYPE}
}`

    fs.writeFile(envMoFile, fileContent, (err) => {
      if (err) {
        console.error(`Error writing to Env.mo: ${err}`)
        process.exit(1)
      }
      console.log(`Env.mo updated successfully for mode: ${mode}`)
    })
  })

program
  .command('set-origins-env')
  .description('Replace parameters in ii-alternative-origins file based on environment mode')
  .option('--mode <mode>', 'Environment mode (e.g., development, production, staging)', 'development')
  .action((cmd) => {
    const { mode } = cmd
    loadEnv(mode)

    const originsFile = path.resolve(__dirname, CONFIG.paths.origins.source)
    const origins = process.env.ALTERNATIVE_ORIGINS ? process.env.ALTERNATIVE_ORIGINS.split(',') : []

    let fileContent = JSON.stringify(
      {
        alternativeOrigins: origins
      },
      null,
      2
    )

    fs.writeFile(originsFile, fileContent, (err) => {
      if (err) {
        console.error(`Error writing to ii-alternative-origins: ${err}`)
        process.exit(1)
      }
      console.log(`ii-alternative-origins updated successfully for mode: ${mode}`)
    })
  })

program.parse(process.argv)
