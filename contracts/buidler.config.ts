import fs from 'fs';
import path from 'path';

import { BuidlerConfig, usePlugin, task } from '@nomiclabs/buidler/config';

usePlugin("@nomiclabs/buidler-waffle");
usePlugin('@nomiclabs/buidler-ganache')

const GAS_LIMIT = 10000000

const config: BuidlerConfig = {
  networks: {
    buidlerevm: {
      gas: GAS_LIMIT,
      blockGasLimit: GAS_LIMIT,
    },
    localhost: {
      url: "http://127.0.0.1:18545"
    },
    ganache: {
      // Workaround for https://github.com/nomiclabs/buidler/issues/518
      url: 'http://127.0.0.1:8555',
      gasLimit: GAS_LIMIT,
    } as any,
    rinkeby: {
      url: process.env.ETHEREUM_JSONRPC_HTTP_URL || 'http://127.0.0.1:8545',
      accounts: { mnemonic: '' },
    },
    xdai: {
      url: 'https://rpc.xdaichain.com',
      timeout: 60000,
      accounts: { mnemonic: '' },
    },
  },
  paths: {
    artifacts: "build/contracts",
    tests: "tests"
  },
  solc: {
    version: "0.6.12",
    optimizer: {
      enabled: true,
      runs: 20
    }
  },
};

task('compile', 'Compiles the entire project, building all artifacts', async (_, { config }, runSuper) => {
  await runSuper();
  // Copy Poseidon artifacts to target directory
  fs.copyFileSync('../node_modules/maci-contracts/compiled/PoseidonT3.json', path.join(config.paths.artifacts, 'PoseidonT3.json'));
  fs.copyFileSync('../node_modules/maci-contracts/compiled/PoseidonT6.json', path.join(config.paths.artifacts, 'PoseidonT6.json'));
  // Prepare verifier artifacts for 'test' circuits
  const verifiers = ['BatchUpdateStateTreeVerifier', 'QuadVoteTallyVerifier']
  for (const contractName of verifiers) {
    const abi = JSON.parse(fs.readFileSync(`../node_modules/maci-contracts/compiled/${contractName}.abi`).toString())
    const bytecode = fs.readFileSync(`../node_modules/maci-contracts/compiled/${contractName}.bin`).toString()
    const artifact = { contractName, abi, bytecode }
    fs.writeFileSync(
      path.join(config.paths.artifacts, `${contractName}.json`),
      JSON.stringify(artifact),
    )
  }
});

export default config
