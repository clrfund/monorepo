<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h2>Claim funds</h2>
      <transaction
        :hash="claimTxHash"
        :error="claimTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 2">
      <h2>Funds were claimed!</h2>
      <p>
        <strong
          >{{ formatAmount(amount) }}
          {{ currentRound.nativeTokenSymbol }}</strong
        >
        has been sent to
      </p>
      <div class="address-box">
        <div>
          <div class="address-label">Recipient address</div>
          <div class="address">
            {{ recipientAddress }}
          </div>
        </div>
      </div>
      <button class="btn-primary" @click="$emit('close')">Done</button>
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

@Component({ components: { Transaction } })
export default class ClaimModal extends Vue {
  @Prop() project!: Project
  @Prop() claimed!: Function

  step = 1
  claimTxHash = ''
  claimTxError = ''
  amount = BigNumber.from(0)
  recipientAddress = ''

  get currentRound(): RoundInfo {
    return this.$store.state.currentRound
  }

  formatAmount(value: BigNumber): string {
    const { nativeTokenDecimals } = this.currentRound
    return formatAmount(value, nativeTokenDecimals)
  }

  mounted() {
    this.claim()
  }

  private async claim() {
    const signer: Signer =
      this.$store.state.currentUser.walletProvider.getSigner()
    const { fundingRoundAddress, recipientTreeDepth } = this.currentRound
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
    const recipientClaimData = getRecipientClaimData(
      this.project.index,
      recipientTreeDepth,
      this.$store.state.tally
    )
    let claimTxReceipt
    try {
      claimTxReceipt = await waitForTransaction(
        fundingRound.claimFunds(...recipientClaimData),
        (hash) => (this.claimTxHash = hash)
      )
    } catch (error) {
      this.claimTxError = error.message
      return
    }
    this.amount = getEventArg(
      claimTxReceipt,
      fundingRound,
      'FundsClaimed',
      '_amount'
    )
    this.recipientAddress = getEventArg(
      claimTxReceipt,
      fundingRound,
      'FundsClaimed',
      '_recipient'
    )

    this.claimed()
    this.step += 1
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.modal-body {
  text-align: left;
  background: $bg-secondary-color;
  border-radius: 1rem;
  box-shadow: $box-shadow;
  padding: 1.5rem;
}

.address-box {
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  box-shadow: $box-shadow;
  background: $clr-blue-gradient;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: $breakpoint-m) {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .address-label {
    font-size: 14px;
    margin: 0;
    font-weight: 400;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
  }

  .address {
    display: flex;
    font-family: 'Glacial Indifference', sans-serif;
    font-weight: 600;
    border-radius: 8px;
    align-items: center;
    gap: 0.5rem;
    word-break: break-all;
  }
}
</style>
