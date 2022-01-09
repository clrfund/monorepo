<template>
  <div>
    <loader v-if="isLoading" />
    <p v-if="claimed">
      ✔️ {{ formatAmount(allocatedAmount) }} {{ tokenSymbol }} claimed
    </p>
    <button
      v-if="hasClaimBtn() && !claimed"
      class="btn-action"
      :disabled="!canClaim()"
      @click="claim()"
    >
      Claim {{ formatAmount(allocatedAmount) }} {{ tokenSymbol }}
    </button>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { FixedNumber } from 'ethers'

import { getAllocatedAmount, isFundsClaimed } from '@/api/claims'
import { Project } from '@/api/projects'
import { RoundStatus, RoundInfo } from '@/api/round'
import { Tally } from '@/api/tally'

import { LOAD_TALLY } from '@/store/action-types'
import { formatAmount } from '@/utils/amounts'
import { markdown } from '@/utils/markdown'

import ClaimModal from '@/components/ClaimModal.vue'
import Loader from '@/components/Loader.vue'

@Component({
  components: { Loader },
})
export default class ClaimButton extends Vue {
  @Prop() project!: Project

  allocatedAmount: FixedNumber | null = null
  claimed: boolean | null = null
  isLoading = true

  get currentRound(): RoundInfo | null {
    return this.$store.state.currentRound
  }

  get tally(): Tally | null {
    return this.$store.state.tally
  }

  get descriptionHtml(): string {
    return markdown.render(this.project?.description || '')
  }

  get tokenSymbol(): string {
    const { nativeTokenSymbol } = this.$store.state.currentRound
    return nativeTokenSymbol ?? ''
  }

  created() {
    this.checkAllocation()
  }

  @Watch('currentRound')
  async checkAllocation() {
    // If the current round is not finalized or the allocated amount was already
    // fetched then don't do anything
    if (
      !this.project ||
      !this.currentRound ||
      !this.$store.getters.isRoundFinalized ||
      this.allocatedAmount
    ) {
      this.isLoading = false
      return
    }

    this.isLoading = true
    if (!this.tally) {
      await this.loadTally()
    }

    this.allocatedAmount = await getAllocatedAmount(
      this.currentRound.fundingRoundAddress,
      this.currentRound.nativeTokenDecimals,
      this.tally!.results.tally[this.project.index],
      this.tally!.totalVoiceCreditsPerVoteOption.tally[this.project.index]
    )
    this.claimed = await isFundsClaimed(
      this.currentRound.fundingRoundAddress,
      this.project.address
    )
    this.isLoading = false
  }

  async loadTally() {
    await this.$store.dispatch(LOAD_TALLY)
  }

  hasClaimBtn(): boolean {
    return (
      !!this.currentRound &&
      this.currentRound.status === RoundStatus.Finalized &&
      this.project !== null &&
      this.project.index !== 0 &&
      !this.project.isHidden &&
      this.allocatedAmount !== null &&
      this.claimed !== null
    )
  }

  canClaim(): boolean {
    return this.hasClaimBtn() && this.$store.state.currentUser && !this.claimed
  }

  formatAmount(value: FixedNumber): string {
    const maxDecimals = 6
    const { nativeTokenDecimals } = this.currentRound!
    return formatAmount(value, nativeTokenDecimals, null, maxDecimals)
  }

  claim() {
    this.$modal.show(
      ClaimModal,
      {
        project: this.project,
        claimed: () => {
          // Optimistically update the claimed state
          this.claimed = true
        },
      },
      {}
    )
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';
</style>
