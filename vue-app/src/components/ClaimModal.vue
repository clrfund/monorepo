<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Claim funds</h3>
      <transaction
        :hash="claimTxHash"
        :error="claimTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 2">
      <h3>Success!</h3>
      <div>{{ formatAmount(amount) }} {{ currentRound.nativeTokenSymbol }} has been sent to <code>{{ recipientAddress }}</code></div>
      <button class="btn close-btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { Contract, BigNumber, Signer } from 'ethers'

import { FundingRound } from '@/api/abi'
import { Project } from '@/api/projects'
import { RoundInfo } from '@/api/round'
import Transaction from '@/components/Transaction.vue'
import { formatAmount } from '@/utils/amounts'
import { waitForTransaction, getEventArg } from '@/utils/contracts'
import { getRecipientClaimData } from '@/utils/maci'

@Component({
  components: {
    Transaction,
  },
})
export default class ClaimModal extends Vue {

  @Prop()
  project!: Project

  step = 1
  claimTxHash = ''
  claimTxError = ''
  amount = BigNumber.from(0)
  recipientAddress = ''

  get currentRound(): RoundInfo {
    return this.$store.state.currentRound
  }

  formatAmount(value: BigNumber): string {
    return formatAmount(value, this.currentRound.nativeTokenDecimals)
  }

  mounted() {
    this.claim()
  }

  private async claim() {
    const signer: Signer = this.$store.state.currentUser.walletProvider.getSigner()
    const { fundingRoundAddress, recipientTreeDepth } = this.currentRound
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
    const recipientClaimData = getRecipientClaimData(
      this.project.index,
      recipientTreeDepth,
      this.$store.state.tally,
    )
    let claimTxReceipt
    try {
      claimTxReceipt = await waitForTransaction(
        fundingRound.claimFunds(...recipientClaimData),
        (hash) => this.claimTxHash = hash,
      )
    } catch (error) {
      this.claimTxError = error.message
      return
    }
    this.amount = getEventArg(claimTxReceipt, fundingRound, 'FundsClaimed', '_amount')
    this.recipientAddress = getEventArg(claimTxReceipt, fundingRound, 'FundsClaimed', '_recipient')
    this.step += 1
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.close-btn {
  margin-top: $modal-space;
}
</style>
