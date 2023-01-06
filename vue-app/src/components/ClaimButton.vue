<template>
  <div>
    <loader v-if="isLoading" />
    <p v-if="claimed">
      {{
        $t('claimButton.p', {
          allocatedAmount: formatAmount(allocatedAmount),
          tokenSymbol: tokenSymbol,
        })
      }}
    </p>
    <button
      v-if="hasClaimBtn() && !claimed"
      class="btn-action"
      :disabled="!canClaim()"
      @click="claim()"
    >
      {{
        $t('claimButton.button', {
          allocatedAmount: formatAmount(allocatedAmount),
          tokenSymbol: tokenSymbol,
        })
      }}
    </button>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { BigNumber } from 'ethers'

import { isFundsClaimed } from '@/api/claims'
import { Project } from '@/api/projects'
import { RoundStatus, RoundInfo } from '@/api/round'
import { Token } from '@/api/token'

import { formatAmount } from '@/utils/amounts'
import { markdown } from '@/utils/markdown'

import ClaimModal from '@/components/ClaimModal.vue'
import Loader from '@/components/Loader.vue'
import { LOAD_ROUNDS } from '@/store/action-types'

@Component({
  components: { Loader },
})
export default class ClaimButton extends Vue {
  @Prop() project!: Project
  @Prop() roundAddress!: string

  token: Token | null = null
  allocatedAmount: BigNumber | null = null
  claimed: boolean | null = null
  isLoading = true

  get currentRound(): RoundInfo | null {
    return this.$store.state.currentRound
  }

  get descriptionHtml(): string {
    return markdown.render(this.project?.description || '')
  }

  get tokenSymbol(): string {
    return this.token?.symbol ?? ''
  }

  get tokenDecimals(): number {
    return this.token?.decimals ?? 18
  }

  get isRoundFinalized(): boolean {
    return this.$store.state.rounds.isRoundFinalized(this.roundAddress)
  }

  async created() {
    if (!this.$store.state.rounds) {
      await this.$store.dispatch(LOAD_ROUNDS)
    }
    this.checkAllocation()
  }

  @Watch('currentRound')
  async checkAllocation() {
    // If the current round is not finalized or the allocated amount was already
    // fetched then don't do anything
    if (
      !this.project ||
      !this.currentRound ||
      !this.$store.state.rounds.isRoundFinalized(this.roundAddress) ||
      this.allocatedAmount
    ) {
      this.isLoading = false
      return
    }

    this.isLoading = true

    const selectedRound = await this.$store.state.rounds.getRound(
      this.roundAddress
    )
    if (!selectedRound) {
      this.isLoading = false
      return
    }

    this.token = await selectedRound.getTokenInfo(this.roundAddress)
    this.allocatedAmount = await selectedRound.getAllocatedAmountByProjectIndex(
      this.project.index
    )

    this.claimed = this.$store.getters.isCurrentRound(this.roundAddress)
      ? await isFundsClaimed(this.roundAddress, this.project.address)
      : true
    this.isLoading = false
  }

  hasClaimBtn(): boolean {
    return (
      !!this.currentRound &&
      this.$store.getters.isCurrentRound(this.roundAddress) &&
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

  formatAmount(value: BigNumber | null): string {
    const maxDecimals = 6
    return value
      ? formatAmount(value, this.tokenDecimals, null, maxDecimals)
      : '0'
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
