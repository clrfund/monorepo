import { BuidlerConfig, usePlugin } from '@nomiclabs/buidler/config';

usePlugin('@nomiclabs/buidler-waffle');
usePlugin('buidler-typechain');

const config: BuidlerConfig = {
  solc: {
    version: '0.6.2'
  },
  defaultNetwork: 'buidlerevm',
  paths: {
    artifacts: 'build/contracts'
  },
  typechain: {
    outDir: 'build/types',
    target: 'ethers'
  }
}

export default config;