import { BuidlerConfig, usePlugin } from '@nomiclabs/buidler/config';

usePlugin('@nomiclabs/buidler-ethers');
usePlugin('@nomiclabs/buidler-waffle');
usePlugin('@nomiclabs/buidler-solhint');

const config: BuidlerConfig = {
  solc: {
    version: '0.6.2'
  },
  defaultNetwork: 'buidlerevm',
  paths: {
    artifacts: 'build/contracts'
  }
};

export default config;
