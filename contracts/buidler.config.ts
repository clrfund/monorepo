import fs from 'fs';
import path from 'path';

import { BuidlerConfig, usePlugin, task } from '@nomiclabs/buidler/config';

usePlugin("@nomiclabs/buidler-waffle");
usePlugin("buidler-typechain");

const config: BuidlerConfig = {
  networks: {
    buidlerevm: {
      gas: 10000000,
      blockGasLimit: 10000000,
    },
    localhost: {
      url: "http://127.0.0.1:18545"
    }
  },
  paths: {
    artifacts: "build/contracts",
    tests: "tests"
  },
  solc: {
    version: "0.5.17",
    optimizer: {
      enabled: true,
      runs: 50
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

export default config;