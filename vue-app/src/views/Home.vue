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
        <div class="round-info-value">{{ currentRound.signUpDeadline | formatDate }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Reallocation Deadline:</div>
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

  async mounted() {
    // Wait for round info to load and get project list
    this.$store.watch(
      (state) => state.currentRound,
      this.loadProjects,
    )
    this.loadProjects()

    // Wait for user to connect and get contribution amount
    this.$store.watch(
      (state) => {
        return (
          state.currentRound?.fundingRoundAddress +
          state.currentUser?.walletAddress
        )
      },
      this.loadContribution,
    )
    this.loadContribution()
  }

  private async loadProjects() {
    this.projects = await getProjects(this.currentRound?.startBlock)
  }

  private async loadContribution() {
    const currentUser = this.$store.state.currentUser
    if (!this.currentRound || !currentUser) {
      return
    }
    const contribution = await getContributionAmount(
      this.currentRound.fundingRoundAddress,
      currentUser.walletAddress,
    )
    this.$store.commit(SET_CONTRIBUTION, contribution)
  }

  get contribution(): FixedNumber {
    const decimals = this.currentRound?.nativeTokenDecimals
    if (!decimals) {
      return FixedNumber.from(0)
    }
    return FixedNumber.fromValue(this.$store.state.contribution, decimals)
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
