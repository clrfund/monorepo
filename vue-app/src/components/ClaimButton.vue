<template>
  <button
    v-if="hasClaimBtn()"
    class="btn-primary"
    :disabled="!canClaim()"
    @click="claim()"
  >
    <template v-if="claimed">
      Received {{ formatAmount(allocatedAmount) }} {{ tokenSymbol }}
    </template>
    <template v-else>
      Claim {{ formatAmount(allocatedAmount) }} {{ tokenSymbol }}
    </template>
  </button>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { FixedNumber } from 'ethers'

import { getAllocatedAmount, isFundsClaimed } from '@/api/claims'
import { Project } from '@/api/projects'
import { RoundStatus } from '@/api/round'
import { Tally } from '@/api/tally'
import ClaimModal from '@/components/ClaimModal.vue'
import { markdown } from '@/utils/markdown'
import { formatAmount } from '@/utils/amounts'

@Component
export default class ClaimButton extends Vue {
  @Prop() project!: Project

  allocatedAmount: FixedNumber | null = null
  claimed: boolean | null = null
  isLoading = true

  created() {
    // Wait for tally to load and get claim status
    this.$store.watch((state) => state.tally, this.checkAllocation)
    this.checkAllocation(this.$store.state.tally)
    this.isLoading = false
  }

  private async checkAllocation(tally: Tally | null) {
    const currentRound = this.$store.state.currentRound
    if (
      !this.project ||
      !currentRound ||
      currentRound.status !== RoundStatus.Finalized ||
      !tally
    ) {
      return
    }
    this.allocatedAmount = await getAllocatedAmount(
      currentRound.fundingRoundAddress,
      currentRound.nativeTokenDecimals,
      tally.results.tally[this.project.index],
      tally.totalVoiceCreditsPerVoteOption.tally[this.project.index]
    )
    this.claimed = await isFundsClaimed(
      currentRound.fundingRoundAddress,
      this.project.id
    )
  }

  get tokenSymbol(): string {
    const { nativeTokenSymbol } = this.$store.state.currentRound
    return nativeTokenSymbol ?? ''
  }

  hasClaimBtn(): boolean {
    const { currentRound } = this.$store.state
    return (
      currentRound &&
      currentRound.status === RoundStatus.Finalized &&
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
    const { nativeTokenDecimals } = this.$store.state.currentRound
    return formatAmount(value, nativeTokenDecimals, null, maxDecimals)
  }

  claim() {
    this.$modal.show(
      ClaimModal,
      { project: this.project },
      {},
      {
        closed: () => {
          this.checkAllocation(this.$store.state.tally)
        },
      }
    )
  }

  get descriptionHtml(): string {
    return markdown.render(this.project?.description || '')
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';
</style>
