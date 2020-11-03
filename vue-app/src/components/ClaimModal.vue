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
      <div>{{ amount | formatAmount }} {{ currentRound.nativeTokenSymbol }} has been sent to <code>{{ project.address }}</code></div>
      <button class="btn close-btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { Contract, FixedNumber, Signer } from 'ethers'

import { FundingRound } from '@/api/abi'
import { Project } from '@/api/projects'
import { RoundInfo } from '@/api/round'
import Transaction from '@/components/Transaction.vue'
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
  amount = FixedNumber.from(0)
  claimTxHash = ''
  claimTxError = ''

  get currentRound(): RoundInfo {
    return this.$store.state.currentRound
  }

  mounted() {
    this.claim()
  }

  private async claim() {
    const signer: Signer = this.$store.state.currentUser.walletProvider.getSigner()
    const { fundingRoundAddress, recipientTreeDepth, nativeTokenDecimals } = this.currentRound
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
    const recipientClaimData = getRecipientClaimData(
      this.project.address,
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
    this.amount = FixedNumber.fromValue(
      getEventArg(claimTxReceipt, fundingRound, 'FundsClaimed', '_amount'),
      nativeTokenDecimals,
    )
    this.step += 1
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.close-btn {
  margin-top: 20px;
}
</style>
