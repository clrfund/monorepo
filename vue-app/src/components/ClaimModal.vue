<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Step 1 of 2: Claim funds</h3>
      <div v-if="!claimTx">Please confirm transaction in your wallet</div>
      <div v-if="claimTx">Waiting for confirmation...</div>
      <div class="loader"></div>
    </div>
    <div v-if="step === 2">
      <h3>Step 2 of 2: Success</h3>
      <div>{{ amount | formatAmount }} {{ currentRound.nativeTokenSymbol }} has been sent to {{ project.address }}</div>
      <button class="btn close-btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { Contract, FixedNumber, Signer } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'

import { FundingRound } from '@/api/abi'
import { Project } from '@/api/projects'
import { RoundInfo } from '@/api/round'
import { getEventArg } from '@/utils/contracts'
import { getRecipientClaimData } from '@/utils/maci'

@Component
export default class ClaimModal extends Vue {

  @Prop()
  project!: Project

  step = 1
  amount = FixedNumber.from(0)
  claimTx: TransactionResponse | null = null

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
    const claimTx = await fundingRound.claimFunds(...recipientClaimData)
    this.claimTx = claimTx
    this.amount = FixedNumber.fromValue(
      await getEventArg(claimTx, fundingRound, 'FundsClaimed', '_amount'),
      nativeTokenDecimals,
    )
    this.step += 1
  }
}
</script>

<style scoped lang="scss">
.close-btn {
  margin-top: 20px;
}
</style>
