import { BuidlerConfig, usePlugin } from "@nomiclabs/buidler/config";

usePlugin("@nomiclabs/buidler-waffle");
usePlugin("buidler-typechain");

const config: BuidlerConfig = {
  paths: {
    artifacts: "build/contracts",
    tests: "tests"
  },
  solc: {
    version: "0.6.4"
  },
  typechain: {
    outDir: "build/types",
    target: "ethers"
  }
};

export default config;