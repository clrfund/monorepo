<template>
  <div>
    <loader v-if="isLoading"></loader>
    <div v-else>
      <div class="info" v-if="!$store.getters.isRoundFinalized">
        🤚 The round is not finalized, please check back later
      </div>
      <div class="info" v-else-if="projects.length === 0">
        😢 No projects for this round
      </div>
      <div v-else>
        <div class="header">
          <h2>Leaderboard</h2>
        </div>
        <div class="hr" />
        <leaderboard-list-item
          v-for="(project, index) in projects"
          :project="project"
          :key="project.id"
          :rank="index + 1"
          :votes="getVotes(project.index)"
          :tokenSymbol="tokenSymbol"
          :tokenDecimals="tokenDecimals"
        ></leaderboard-list-item>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import LeaderboardListItem from '@/components/LeaderboardListItem.vue'
import { getCurrentRound, getRoundInfo, RoundStatus } from '@/api/round'
import { Project, getProjects } from '@/api/projects'
import { isValidEthAddress } from '@/utils/accounts'
import Loader from '@/components/Loader.vue'
import { RoundInfo } from '@/api/round'
import { Tally } from '@/api/tally'
import { SELECT_ROUND, LOAD_ROUND_INFO, LOAD_TALLY } from '@/store/action-types'
import { BigNumber } from 'ethers'
// TODO: replace funding.json by getting funding amount from contract or subgraph
// funding.json is a temporary solution for ethcolombia.
import * as Funding from '@/api/funding.json'
import { formatAmount } from '@/utils/amounts'

@Component({
  name: 'leaderboard',
  components: { LeaderboardListItem, Loader },
})
export default class Leaderboard extends Vue {
  roundAddress = ''
  isLoading = true
  projects: Project[] = []

  get currentRound(): RoundInfo {
    return this.$store.state.currentRound
  }

  get tally(): Tally | null {
    return this.$store.state.tally
  }

  get tokenSymbol(): string {
    const { nativeTokenSymbol } = this.currentRound
    return nativeTokenSymbol ?? ''
  }

  get tokenDecimals(): number {
    const { nativeTokenDecimals } = this.currentRound
    return nativeTokenDecimals ?? 18
  }

  sortByAmountDesc(entry1: Project, entry2: Project): number {
    const amount1 = entry1.fundingAmount ?? BigNumber.from(0)
    const amount2 = entry2.fundingAmount ?? BigNumber.from(0)

    const diff = amount2.sub(amount1)

    return diff.isZero() ? 0 : diff.gt(0) ? 1 : -1
  }

  private async loadProjects(roundAddress: string) {
    if (!isValidEthAddress(roundAddress)) {
      return
    }

    const round = await getRoundInfo(
      roundAddress,
      this.$store.state.currentRound
    )

    if (round.status !== RoundStatus.Finalized) {
      return
    }

    const projects = await getProjects(
      round.recipientRegistryAddress,
      round.startTime.toSeconds(),
      round.votingDeadline.toSeconds()
    )

    const visibleProjects = projects.filter((project) => {
      return !project.isHidden && !project.isLocked
    })

    this.projects = visibleProjects
      .map((project) => {
        return {
          ...project,
          fundingAmount: BigNumber.from(Funding.amounts[project.index]),
        }
      })
      .sort(this.sortByAmountDesc)
  }

  async created() {
    this.roundAddress =
      this.$store.state.currentRoundAddress || (await getCurrentRound())

    if (!this.currentRound) {
      await this.loadRound(this.roundAddress)
    }

    if (!this.tally) {
      await this.loadTally()
    }

    await this.loadProjects(this.roundAddress)
    this.isLoading = false
  }

  async loadRound(roundAddress: string) {
    await this.$store.dispatch(SELECT_ROUND, roundAddress)
    await this.$store.dispatch(LOAD_ROUND_INFO)
  }

  async loadTally() {
    await this.$store.dispatch(LOAD_TALLY)
  }

  // this is this donation the project received from the community
  getVotes(projectIndex: number): string {
    const total =
      this.tally?.totalVoiceCreditsPerVoteOption.tally[projectIndex] || '0'
    const adjustedTotal = BigNumber.from(
      this.currentRound.voiceCreditFactor
    ).mul(total)
    const formattedAmount = formatAmount(
      adjustedTotal,
      this.tokenDecimals,
      null,
      0
    )
    return formattedAmount
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.hr {
  grid-area: hr;
  width: 100%;
  border-bottom: 1px solid $border-light;
  margin-bottom: 2rem;
}

.info {
  background: var(--bg-secondary-highlight);
  border-radius: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  margin-top: 2rem;
}
</style>
