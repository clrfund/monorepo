<template>
  <div class="project">
    <router-link class="content-heading" to="/">⟵ All projects</router-link>
    <div v-if="project" class="project-page">
      <img class="project-image" :src="project.imageUrl" :alt="project.name">
      <h2 class="project-name">{{ project.name }}</h2>
      <button
        class="btn contribute-btn"
        :disabled="!canContribute()"
        @click="contribute()"
      >
        Contribute
      </button>
      <button
        class="btn claim-btn"
        :disabled="!canClaim()"
        @click="claim()"
      >
        <template v-if="allocatedAmount">
          Claim {{ allocatedAmount | formatAmount }} {{ currentRound.nativeTokenSymbol }}
        </template>
        <template v-else>
          Claim
        </template>
      </button>
      <div class="project-description">{{ project.description }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { FixedNumber } from 'ethers'

import { getAllocatedAmount, isFundsClaimed } from '@/api/claims'
import { CART_MAX_SIZE } from '@/api/contributions'
import { Project, getProject } from '@/api/projects'
import { RoundInfo, RoundStatus } from '@/api/round'
import { Tally } from '@/api/tally'
import ClaimModal from '@/components/ClaimModal.vue'
import { ADD_CART_ITEM } from '@/store/mutation-types'

@Component({
  name: 'ProjectView',
})
export default class ProjectView extends Vue {

  project: Project | null = null
  allocatedAmount: FixedNumber | null = null
  claimed: boolean | null = null

  get currentRound(): RoundInfo {
    return this.$store.state.currentRound
  }

  private async checkAllocation(tally: Tally) {
    const currentRound = this.currentRound
    if (!this.project || !currentRound || currentRound.status !== RoundStatus.Finalized || !tally) {
      return
    }
    this.allocatedAmount = await getAllocatedAmount(
      currentRound.fundingRoundAddress,
      currentRound.nativeTokenDecimals,
      tally.results.tally[this.project.index],
      tally.totalVoiceCreditsPerVoteOption.tally[this.project.index],
    )
    this.claimed = await isFundsClaimed(
      currentRound.fundingRoundAddress,
      this.project.address,
    )
  }

  async created() {
    const project = await getProject(this.$route.params.address)
    if (project !== null) {
      this.project = project
    } else {
      // Project not found
      this.$router.push({ name: 'home' })
      return
    }
    // Wait for tally to load and get claim status
    this.$store.watch(
      (state) => state.tally,
      this.checkAllocation,
    )
    this.checkAllocation(this.$store.state.tally)
  }

  canContribute() {
    return this.$store.state.cart.length < CART_MAX_SIZE
  }

  contribute() {
    this.$store.commit(ADD_CART_ITEM, { ...this.project, amount: 0 })
  }

  canClaim(): boolean {
    const currentRound = this.currentRound
    return (
      currentRound &&
      currentRound.status === RoundStatus.Finalized &&
      this.$store.state.account &&
      this.claimed === false
    )
  }

  claim() {
    this.$modal.show(
      ClaimModal,
      { project: this.project },
      {
        clickToClose: false,
        height: 'auto',
        width: 450,
      },
      {
        closed: () => {
          this.checkAllocation(this.$store.state.tally)
        },
      },
    )
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.project-image {
  border: $border;
  border-radius: 20px;
  display: block;
  height: 300px;
  object-fit: cover;
  text-align: center;
  width: 100%;
}

.project-name {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 40px;
  letter-spacing: -0.015em;
  margin: $content-space 0;
}

.contribute-btn,
.claim-btn {
  margin: 0 $content-space $content-space 0;
  width: 300px;
}

.project-description {
  font-size: 20px;
  line-height: 30px;
}
</style>
