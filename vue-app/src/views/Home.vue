<template>
  <div class="home">
    <div class="current-round">
      <div>Current round: {{ currentRound.fundingRoundAddress }}</div>
      <div>Native token address: {{ currentRound.nativeTokenAddress }}</div>
      <div>Contribution deadline: {{ currentRound.contributionDeadline }}</div>
      <div>Contributions: {{ currentRound.contributions }}</div>
    </div>
    <div class="project-list">
      <ProjectItem
        v-for="item in recipients"
        v-bind:address="item.address"
        v-bind:name="item.name"
        v-bind:key="item.address"
      >
      </ProjectItem>
    </div>
  </div>
</template>

<script>
import { ethers } from "ethers";

import { default as FundingRoundFactory } from "@/../../contracts/build/contracts/FundingRoundFactory";
import { default as FundingRound } from "@/../../contracts/build/contracts/FundingRound";

import ProjectItem from "@/components/ProjectItem.vue";

async function getData() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.VUE_APP_ETHEREUM_API_URL
  );
  const factoryAddress = process.env.VUE_APP_CLRFUND_FACTORY_ADDRESS;
  const factory = new ethers.Contract(
    factoryAddress,
    FundingRoundFactory.abi,
    provider
  );

  const recipientFilter = factory.filters.RecipientAdded();
  recipientFilter.fromBlock = 0;
  const recipients = (await provider.getLogs(recipientFilter)).map(log => {
    const event = factory.interface.parseLog(log);
    return {
      address: event.args["0"],
      name: event.args["1"]
    };
  });

  const fundingRoundAddress = await factory.getCurrentRound();

  if (fundingRoundAddress === "0x0000000000000000000000000000000000000000") {
    return {
      fundingRoundAddress: "N/A",
      nativeTokenAddress: "N/A",
      contributions: []
    };
  }

  const fundingRound = new ethers.Contract(
    fundingRoundAddress,
    FundingRound.abi,
    provider
  );
  const nativeTokenAddress = await fundingRound.nativeToken();
  const contributionDeadline = new Date(
    (await fundingRound.contributionDeadline()) * 1000
  );

  const contributionsFilter = fundingRound.filters.NewContribution();
  const contributions = (await provider.getLogs(contributionsFilter)).length;

  return {
    recipients,
    currentRound: {
      fundingRoundAddress,
      nativeTokenAddress,
      contributionDeadline,
      contributions
    }
  };
}

export default {
  name: "Home",
  components: {
    ProjectItem
  },
  data() {
    return {
      recipients: [],
      currentRound: {
        fundingRoundAddress: "",
        nativeTokenAddress: "",
        contributionDeadline: new Date(),
        contributions: ""
      }
    };
  },
  async mounted() {
    const { recipients, currentRound } = await getData();
    this.recipients = recipients;
    this.currentRound = currentRound;
  }
};
</script>

<style scoped lang="scss">
.project-list {
  display: flex;
  justify-content: space-around;
  margin: 20px auto 0;
  width: 1000px;
}
</style>
