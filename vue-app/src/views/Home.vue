<template>
  <div class="home">
    <div class="current-round">
      <div>Current round: {{ currentRound.fundingRoundAddress }}</div>
      <div>Native token address: {{ currentRound.nativeTokenAddress }}</div>
      <div>Contributions: {{ currentRound.contributions }}</div>
    </div>
  </div>
</template>

<script>
import { ethers } from "ethers";

import { default as FundingRoundFactory } from "@/../../contracts/build/contracts/FundingRoundFactory";
import { default as FundingRound } from "@/../../contracts/build/contracts/FundingRound";

async function getCurrentRound() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.VUE_APP_ETHEREUM_API_URL
  );
  const factoryAddress = process.env.VUE_APP_CLRFUND_FACTORY_ADDRESS;
  const factory = new ethers.Contract(
    factoryAddress,
    FundingRoundFactory.abi,
    provider
  );
  const fundingRoundAddress = await factory.getCurrentRound();
  const fundingRound = new ethers.Contract(
    fundingRoundAddress,
    FundingRound.abi,
    provider
  );
  const nativeTokenAddress = await fundingRound.nativeToken();

  const contributionsFilter = fundingRound.filters.NewContribution();
  const contributions = (await provider.getLogs(contributionsFilter)).length;

  return {
    fundingRoundAddress,
    nativeTokenAddress,
    contributions
  };
}

export default {
  name: "Home",
  data() {
    return {
      currentRound: {
        fundingRoundAddress: "",
        nativeTokenAddress: "",
        contributions: ""
      }
    };
  },
  async mounted() {
    this.currentRound = await getCurrentRound();
  }
};
</script>
