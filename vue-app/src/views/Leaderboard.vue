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
import { LOAD_TALLY, SELECT_ROUND, LOAD_ROUND_INFO } from '@/store/action-types'
import { getAllocatedAmount } from '@/api/claims'
import { BigNumber } from 'ethers'

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

  sortByAmount(entry1: Project, entry2: Project): number {
    const amount1 = entry1.fundingAmount ?? BigNumber.from(0)
    const amount2 = entry2.fundingAmount ?? BigNumber.from(0)

    const diff = amount2.sub(amount1)

    return diff.isZero() ? 0 : diff.gt(0) ? 1 : -1
  }

  private async tryGetAllocatedAmount(
    projectIndex: number
  ): Promise<BigNumber> {
    try {
      const votes = this.tally?.results.tally[projectIndex] || '0'
      const spent =
        this.tally?.totalVoiceCreditsPerVoteOption.tally[projectIndex] || '0'
      return getAllocatedAmount(
        this.currentRound.fundingRoundAddress,
        votes,
        spent
      )
    } catch (err) {
      return BigNumber.from(0)
    }
  }

  private async getAllocatedAmounts(projectIndices: number[]) {
    return Promise.all(
      projectIndices.map((projectIndex) =>
        this.tryGetAllocatedAmount(projectIndex)
      )
    )
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

    if (!this.currentRound) {
      await this.loadRound(roundAddress)
    }

    if (!this.tally) {
      await this.loadTally()
    }

    const projects = await getProjects(
      round.recipientRegistryAddress,
      round.startTime.toSeconds(),
      round.votingDeadline.toSeconds()
    )

    const visibleProjects = projects.filter((project) => {
      return !project.isHidden && !project.isLocked
    })

    const allocatedAmounts = await this.getAllocatedAmounts(
      visibleProjects.map((project) => project.index)
    )

    this.projects = visibleProjects
      .map((project, i: number) => {
        return { ...project, fundingAmount: allocatedAmounts[i] }
      })
      .sort(this.sortByAmount)
  }

  async mounted() {
    //TODO: update to take factory address as a parameter, default to env. variable
    this.roundAddress =
      this.$store.state.currentRoundAddress || (await getCurrentRound())

    await this.loadProjects(this.roundAddress)
    this.isLoading = false
  }

  async loadTally() {
    await this.$store.dispatch(LOAD_TALLY)
  }

  async loadRound(roundAddress: string) {
    await this.$store.dispatch(SELECT_ROUND, roundAddress)
    await this.$store.dispatch(LOAD_ROUND_INFO)
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
