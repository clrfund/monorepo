<template>
  <div class="home">
    <h1 class="content-heading">Home</h1>
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
        <div class="round-info-value">{{ currentRound.totalFunds | formatAmount }} {{ currentRound.nativeTokenSymbol }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Matching Pool:</div>
        <div class="round-info-value">{{ currentRound.matchingPool | formatAmount }} {{ currentRound.nativeTokenSymbol }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Contributions:</div>
        <div class="round-info-value">{{ currentRound.contributions | formatAmount }} {{ currentRound.nativeTokenSymbol }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Your Contribution:</div>
        <div class="round-info-value">{{ contribution | formatAmount }} {{ currentRound.nativeTokenSymbol }}</div>
      </div>
    </div>
    <div class="project-list">
      <project-list-item
        v-for="project in projects"
        v-bind:project="project"
        v-bind:key="project.address"
      >
      </project-list-item>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { FixedNumber } from 'ethers'

import { getContributionAmount } from '@/api/contributions'
import { RoundInfo } from '@/api/round'
import { Project, getProjects } from '@/api/projects'

import ProjectListItem from '@/components/ProjectListItem.vue'
import { LOAD_ROUND_INFO } from '@/store/action-types'
import { SET_CONTRIBUTION } from '@/store/mutation-types'

@Component({
  name: 'Home',
  components: {
    ProjectListItem,
  },
})
export default class Home extends Vue {

  projects: Project[] = []

  get currentRound(): RoundInfo | null {
    return this.$store.state.currentRound
  }

  private async updateCurrentRound() {
    await this.$store.dispatch(LOAD_ROUND_INFO)
    const walletAddress = this.$store.state.account
    if (this.currentRound && walletAddress) {
      const contribution = await getContributionAmount(
        walletAddress,
        this.currentRound.fundingRoundAddress,
        this.currentRound.nativeTokenDecimals,
      )
      this.$store.commit(SET_CONTRIBUTION, contribution)
    }
  }

  async mounted() {
    this.projects = await getProjects()
    this.updateCurrentRound()
    this.$store.watch(
      (state) => state.account,
      async (account: string) => {
        if (this.currentRound && account) {
          this.updateCurrentRound()
        }
      },
    )
  }

  get contribution(): FixedNumber {
    return this.$store.state.contribution
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

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
  flex-wrap: wrap;
  justify-content: space-between;
  margin: $content-space (-$content-space / 2) 0;
}
</style>
