import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

import { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } from 'hardhat/builtin-tasks/task-names'
import { HardhatUserConfig, subtask, task } from 'hardhat/config'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ganache'
import 'hardhat-contract-sizer'
import '@nomiclabs/hardhat-etherscan'
import './tasks'

dotenv.config()

const GAS_LIMIT = 20000000
const WALLET_MNEMONIC = process.env.WALLET_MNEMONIC
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY

let accounts
if (WALLET_MNEMONIC) {
  accounts = { mnemonic: WALLET_MNEMONIC }
}
if (WALLET_PRIVATE_KEY) {
  accounts = [WALLET_PRIVATE_KEY]
}

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      gas: GAS_LIMIT,
      blockGasLimit: GAS_LIMIT,
    },
    localhost: {
      url: 'http://127.0.0.1:18545',
      timeout: 60000,
      gas: GAS_LIMIT,
      blockGasLimit: GAS_LIMIT,
    },
    ganache: {
      // Workaround for https://github.com/nomiclabs/hardhat/issues/518
      url: 'http://127.0.0.1:8555',
      gasLimit: GAS_LIMIT,
    } as any,
    goerli: {
      url: process.env.JSONRPC_HTTP_URL || 'http://127.0.0.1:8545',
      accounts,
    },
    xdai: {
      url: process.env.JSONRPC_HTTP_URL || 'https://rpc.gnosischain.com',
      timeout: 60000,
      accounts,
    },
    'arbitrum-goerli': {
      url:
        process.env.JSONRPC_HTTP_URL || 'https://goerli-rollup.arbitrum.io/rpc',
      accounts,
    },
    'mantle-testnet': {
      url: process.env.JSONRPC_HTTP_URL || 'https://rpc.testnet.mantle.xyz',
      accounts,
    },
    rinkarby: {
      url: process.env.JSONRPC_HTTP_URL || 'https://rinkeby.arbitrum.io/rpc',
      accounts,
    },
    arbitrum: {
      url: process.env.JSONRPC_HTTP_URL || 'https://arb1.arbitrum.io/rpc',
      accounts,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || 'YOUR_ETHERSCAN_API_KEY',
  },
  paths: {
    artifacts: 'build/contracts',
    tests: 'tests',
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  solidity: {
    version: '0.8.10',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
    overrides: {
      'contracts/FundingRoundFactory.sol': {
        version: '0.8.10',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      'contracts/FundingRound.sol': {
        version: '0.8.10',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      'contracts/snarkVerifiers/BatchUpdateStateTreeVerifier32.sol': {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000000,
          },
        },
      },
      'contracts/snarkVerifiers/QuadVoteTallyVerifier32.sol': {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000000,
          },
        },
      },
      'contracts/recipientRegistry/OptimisticRecipientRegistry.sol': {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      'contracts/userRegistry/SimpleUserRegistry.sol': {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      'contracts/userRegistry/BrightIdUserRegistry.sol': {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
    },
  },
}

// filter out files that we don't want to compile
subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS, async (_, __, runSuper) => {
  const paths = await runSuper()

  return paths.filter((filePath: string) => {
    return !filePath.includes('snarkVerifiers')
  })
})

task(
  'compile',
  'Compiles the entire project, building all artifacts',
  async (_, { config }, runSuper) => {
    await runSuper()
    // Copy Poseidon artifacts
    const externalContracts: Array<string> = [
      'PoseidonT3',
      'PoseidonT4',
      'PoseidonT5',
      'PoseidonT6',
    ]
    for (const contractName of externalContracts) {
      const artifact = JSON.parse(
        fs
          .readFileSync(
            `./node_modules/@clrfund/maci-contracts/artifacts/contracts/crypto/Hasher.sol/${contractName}.json`
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
