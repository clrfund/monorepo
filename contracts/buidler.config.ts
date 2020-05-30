import { BuidlerConfig, usePlugin } from "@nomiclabs/buidler/config";

usePlugin("@nomiclabs/buidler-waffle");
usePlugin("buidler-typechain");

const config: BuidlerConfig = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:18545"
    }
  },
  paths: {
    artifacts: "build/contracts",
    tests: "tests"
  },
  solc: {
    version: "0.6.4",
    optimizer: {
      enabled: true,
      runs: 10000
    }
  },
  typechain: {
    outDir: "build/types",
    target: "ethers"
  }
};

export default config;