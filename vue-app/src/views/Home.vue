<template>
  <div class="home">
    <h1>Home</h1>
    <div v-if="currentRound" class="round-info">
      <div class="round-info-item">
        <div class="round-info-title">Current Round:</div>
        <div class="round-info-value">{{ currentRound.fundingRoundAddress }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Status:</div>
        <div class="round-info-value">{{ currentRound.status }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Contribution Deadline:</div>
        <div class="round-info-value">{{ currentRound.contributionDeadline | formatDate }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Voting Deadline:</div>
        <div class="round-info-value">{{ currentRound.votingDeadline | formatDate }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Total Funds:</div>
        <div class="round-info-value">{{ currentRound.totalFunds | formatAmount }} {{ currentRound.nativeToken }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Matching Pool:</div>
        <div class="round-info-value">{{ currentRound.matchingPool | formatAmount }} {{ currentRound.nativeToken }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Contributions:</div>
        <div class="round-info-value">{{ currentRound.contributions | formatAmount }} {{ currentRound.nativeToken }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Your Contribution:</div>
        <div class="round-info-value">{{ currentRound.contribution | formatAmount }} {{ currentRound.nativeToken }}</div>
      </div>
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
import { ethers, BigNumber, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'

import { abi as FundingRoundFactory } from '../../../contracts/build/contracts/FundingRoundFactory.json'
import { abi as FundingRound } from '../../../contracts/build/contracts/FundingRound.json'
import { abi as ERC20 } from '../../../contracts/build/contracts/ERC20Detailed.json'

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
    nativeToken: string;
    status: string;
    contributionDeadline: DateTime;
    votingDeadline: DateTime;
    totalFunds: FixedNumber;
    matchingPool: FixedNumber;
    contributions: FixedNumber;
    contribution: FixedNumber;
  } | null;
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
      currentRound: null,
    }
  }

  const fundingRound = new ethers.Contract(
    fundingRoundAddress,
    FundingRound,
    provider,
  )
  const nativeToken = new ethers.Contract(
    await fundingRound.nativeToken(),
    ERC20,
    provider,
  )
  const nativeTokenSymbol = await nativeToken.symbol()
  const nativeTokenDecs = await nativeToken.decimals()
  const contributionDeadline = DateTime.fromSeconds(
    parseInt(await fundingRound.contributionDeadline()),
  )
  const votingDeadline = DateTime.fromSeconds(
    parseInt(await fundingRound.votingDeadline()),
  )

  const isFinalized = await fundingRound.isFinalized()
  const isCancelled = await fundingRound.isCancelled()
  let status: string
  let matchingPool: BigNumber
  if (isCancelled) {
    status = 'Cancelled'
    matchingPool = BigNumber.from(0)
  } else if (isFinalized) {
    status = 'Finalized'
    matchingPool = await fundingRound.matchingPoolSize()
  } else {
    status = 'Running'
    matchingPool = await nativeToken.balanceOf(factoryAddress)
  }

  const contributionFilter = fundingRound.filters.NewContribution()
  const contributionEvents = await fundingRound.queryFilter(contributionFilter, 0)
  let contributions = BigNumber.from(0)
  contributionEvents.forEach(event => {
    if (!event.args) {
      return
    }
    contributions += event.args._amount
  })
  const contribution = BigNumber.from(0)
  const totalFunds = matchingPool.add(contributions)

  return {
    recipients,
    currentRound: {
      fundingRoundAddress,
      nativeToken: nativeTokenSymbol,
      status,
      contributionDeadline,
      votingDeadline,
      totalFunds: FixedNumber.fromValue(totalFunds, nativeTokenDecs),
      matchingPool: FixedNumber.fromValue(matchingPool, nativeTokenDecs),
      contributions: FixedNumber.fromValue(contributions, nativeTokenDecs),
      contribution: FixedNumber.fromValue(contribution, nativeTokenDecs),
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
      currentRound: null,
    }
  },
  filters: {
    formatDate: (value: DateTime): string | null => {
      return value ? value.toLocaleString(DateTime.DATETIME_SHORT) : null
    },
    formatAmount: (value: FixedNumber): string | null => {
      return value ? (value._value === '0.0' ? '0' : value.toString()) : null
    },
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

#content h1 {
  border-bottom: none;
  margin-bottom: 0;
}

.round-info {
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;

  .round-info-item {
    border-right: $border;
    border-top: $border;
    box-sizing: border-box;
    flex: 0 0 25%;
    overflow: hidden;
    padding: 10px $content-space;

    &:nth-child(4n + 1) {
      padding-left: 0;
    }

    &:nth-child(4n + 0) {
      border-right: none;
    }
  }

  .round-info-title {
    margin-bottom: 5px;
  }

  .round-info-value {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.project-list {
  display: flex;
  justify-content: space-between;
  margin: $content-space auto 0;
}
</style>
