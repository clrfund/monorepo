<template>
  <div class="home">
    <h1>Home</h1>
    <div class="current-round">
      <div>Current round: {{ currentRound.fundingRoundAddress }}</div>
      <div>Native token address: {{ currentRound.nativeTokenAddress }}</div>
      <div>Contribution deadline: {{ currentRound.contributionDeadline }}</div>
      <div>Contributions: {{ currentRound.contributions }}</div>
    </div>
    <div class="project-list">
      <ProjectItem
        v-for="item in recipients"
        v-bind:project="item"
        v-bind:key="item.address"
      >
      </ProjectItem>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { ethers } from 'ethers'

import { abi as FundingRoundFactory } from '../../../contracts/build/contracts/FundingRoundFactory.json'
import { abi as FundingRound } from '../../../contracts/build/contracts/FundingRound.json'

import ProjectItem from '@/components/ProjectItem.vue'

interface Recipient {
  address: string;
  name: string;
  description: string;
  imageUrl: string;
  index: number;
}

interface RoundInfo {
  recipients: Recipient[];
  currentRound: {
    fundingRoundAddress: string;
    nativeTokenAddress: string;
    contributionDeadline: Date | null;
    contributions: number;
  };
}

async function getData(): Promise<RoundInfo> {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.VUE_APP_ETHEREUM_API_URL,
  )
  const ipfsGatewayUrl = process.env.VUE_APP_IPFS_GATEWAY_URL
  const factoryAddress = process.env.VUE_APP_CLRFUND_FACTORY_ADDRESS as string
  const factory = new ethers.Contract(
    factoryAddress,
    FundingRoundFactory,
    provider,
  )

  const recipientFilter = factory.filters.RecipientAdded()
  const recipientEvents = await factory.queryFilter(recipientFilter, 0)
  const recipients: Recipient[] = []
  recipientEvents.forEach(event => {
    if (!event.args) {
      return
    }
    const metadata = JSON.parse(event.args._metadata)
    recipients.push({
      address: event.args._fundingAddress,
      name: metadata.name,
      description: metadata.description,
      imageUrl: `${ipfsGatewayUrl}${metadata.imageHash}`,
      index: event.args._index,
    })
  })

  const fundingRoundAddress = await factory.getCurrentRound()

  if (fundingRoundAddress === '0x0000000000000000000000000000000000000000') {
    return {
      recipients,
      currentRound: {
        fundingRoundAddress: 'N/A',
        nativeTokenAddress: 'N/A',
        contributionDeadline: null,
        contributions: 0,
      },
    }
  }

  const fundingRound = new ethers.Contract(
    fundingRoundAddress,
    FundingRound,
    provider,
  )
  const nativeTokenAddress = await fundingRound.nativeToken()
  const contributionDeadline = new Date(
    (await fundingRound.contributionDeadline()) * 1000,
  )

  const contributionsFilter = fundingRound.filters.NewContribution()
  const contributions = (await fundingRound.queryFilter(contributionsFilter, 0)).length

  return {
    recipients,
    currentRound: {
      fundingRoundAddress,
      nativeTokenAddress,
      contributionDeadline,
      contributions,
    },
  }
}

export default Vue.extend({
  name: 'Home',
  components: {
    ProjectItem,
  },
  data(): RoundInfo {
    return {
      recipients: [],
      currentRound: {
        fundingRoundAddress: '',
        nativeTokenAddress: '',
        contributionDeadline: null,
        contributions: 0,
      },
    }
  },
  async mounted() {
    const { recipients, currentRound } = await getData()
    this.recipients = recipients
    this.currentRound = currentRound
  },
})
</script>

<style scoped lang="scss">
@import '../styles/vars';

.project-list {
  display: flex;
  justify-content: space-between;
  margin: $content-space auto 0;
}
</style>
