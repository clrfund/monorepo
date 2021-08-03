import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

import { HardhatUserConfig, task } from 'hardhat/config'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ganache'

dotenv.config()

const GAS_LIMIT = 10000000
const WALLET_MNEMONIC = process.env.WALLET_MNEMONIC || ''

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      gas: GAS_LIMIT,
      blockGasLimit: GAS_LIMIT,
    },
    localhost: {
      url: 'http://127.0.0.1:18545',
    },
    ganache: {
      // Workaround for https://github.com/nomiclabs/hardhat/issues/518
      url: 'http://127.0.0.1:8555',
      gasLimit: GAS_LIMIT,
    } as any,
    rinkeby: {
      url: process.env.RINKEBY_JSONRPC_HTTP_URL || 'http://127.0.0.1:8545',
      accounts: { mnemonic: WALLET_MNEMONIC },
    },
    xdai: {
      url: process.env.XDAI_JSONRPC_HTTP_URL || 'https://rpc.xdaichain.com',
      timeout: 60000,
      accounts: { mnemonic: WALLET_MNEMONIC },
    },
    rinkarby: {
      url: process.env.RINKARBY_JSONRPC_HTTP_URL || 'http://127.0.0.1:8545',
      accounts: { mnemonic: WALLET_MNEMONIC },
    },
  },
  paths: {
    artifacts: 'build/contracts',
    tests: 'tests',
  },
  solidity: {
    version: '0.6.12',
    settings: {
      optimizer: {
        enabled: true,
        runs: 20,
      },
    },
  },
}

task(
  'compile',
  'Compiles the entire project, building all artifacts',
  async (_, { config }, runSuper) => {
    await runSuper()
    // Copy Poseidon artifacts
    const poseidons = ['PoseidonT3', 'PoseidonT6']
    for (const contractName of poseidons) {
      const artifact = JSON.parse(
        fs
          .readFileSync(
            `../node_modules/maci-contracts/compiled/${contractName}.json`
          )
          .toString()
      )
      fs.writeFileSync(
        path.join(config.paths.artifacts, `${contractName}.json`),
        JSON.stringify({ ...artifact, linkReferences: {} })
      )
    }
  }
)

export default config
