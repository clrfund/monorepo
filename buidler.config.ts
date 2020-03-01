import { BuidlerConfig, usePlugin } from "@nomiclabs/buidler/config";

usePlugin("@nomiclabs/buidler-waffle");

const config: BuidlerConfig = {
  paths: {
    artifacts: "./build/artifacts"
  },
  solc: {
    version: "0.6.3"
  }
};

export default config;
