import { BuidlerConfig, usePlugin } from "@nomiclabs/buidler/config";

usePlugin("@nomiclabs/buidler-waffle");
usePlugin("buidler-typechain");

const config: BuidlerConfig = {
  paths: {
    artifacts: "./build/artifacts",
    tests: "./tests/contracts"
  },
  solc: {
    version: "0.6.3"
  },
  typechain: {
    outDir: "./build/types",
    target: "ethers"
  }
};

export default config;
