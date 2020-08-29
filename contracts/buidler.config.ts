import fs from 'fs';
import path from 'path';

import { BuidlerConfig, usePlugin, task } from '@nomiclabs/buidler/config';

usePlugin("@nomiclabs/buidler-waffle");
usePlugin("buidler-typechain");
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
  },
  paths: {
    artifacts: "build/contracts",
    tests: "tests"
  },
  solc: {
    version: "0.5.17",
    optimizer: {
      enabled: true,
      runs: 20
    }
  },
  typechain: {
    outDir: "build/types",
    target: "ethers"
  }
};

task('compile', 'Compiles the entire project, building all artifacts', async (_, { config }, runSuper) => {
  await runSuper();
  // Copy Poseidon artifacts to target directory
  fs.copyFileSync('../node_modules/maci-contracts/compiled/PoseidonT3.json', path.join(config.paths.artifacts, 'PoseidonT3.json'));
  fs.copyFileSync('../node_modules/maci-contracts/compiled/PoseidonT6.json', path.join(config.paths.artifacts, 'PoseidonT6.json'));
});

export default config
