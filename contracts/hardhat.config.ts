import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

import { task } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomiclabs/hardhat-ganache'
import 'hardhat-contract-sizer'
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

export default {
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
    'arbitrum-sepolia': {
      url:
        process.env.JSONRPC_HTTP_URL ||
        'https://sepolia-rollup.arbitrum.io/rpc',
      accounts,
    },
    optimism: {
      url: process.env.JSONRPC_HTTP_URL || 'https://mainnet.optimism.io',
      accounts,
    },
    'optimism-sepolia': {
      url: process.env.JSONRPC_HTTP_URL || 'https://sepolia.optimism.io',
      accounts,
    },
    sepolia: {
      url: process.env.JSONRPC_HTTP_URL || 'http://127.0.0.1:8545',
      accounts,
    },
    'mantle-testnet': {
      url: process.env.JSONRPC_HTTP_URL || 'https://rpc.testnet.mantle.xyz',
      accounts,
    },
    arbitrum: {
      url: process.env.JSONRPC_HTTP_URL || 'https://arb1.arbitrum.io/rpc',
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARBISCAN_API_KEY || 'YOUR_ARBISCAN_API_KEY',
      'arbitrum-sepolia':
        process.env.ARBISCAN_API_KEY || 'YOUR_ARBISCAN_API_KEY',
      optimisticEthereum:
        process.env.OPTIMISMSCAN_API_KEY || 'YOUR_OPTIMISMSCAN_API_KEY',
      'optimism-sepolia':
        process.env.OPTIMISMSCAN_API_KEY || 'YOUR_OPTIMISMSCAN_API_KEY',
    },
    customChains: [
      {
        network: 'arbitrum-sepolia',
        chainId: 421614,
        urls: {
          apiURL: 'https://api-sepolia.arbiscan.io/api',
          browserURL: 'https://sepolia.arbiscan.io',
        },
      },
      {
        network: 'optimism-sepolia',
        chainId: 11155420,
        urls: {
          apiURL: 'https://api-sepolia-optimistic.etherscan.io/api',
          browserURL: 'https://sepolia-optimism.etherscan.io',
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
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
      'contracts/recipientRegistry/OptimisticRecipientRegistry.sol': {
        version: '0.8.10',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      'contracts/userRegistry/SimpleUserRegistry.sol': {
        version: '0.8.10',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
      'contracts/userRegistry/BrightIdUserRegistry.sol': {
        version: '0.8.10',
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
            `./node_modules/maci-contracts/build/artifacts/contracts/crypto/${contractName}.sol/${contractName}.json`
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
