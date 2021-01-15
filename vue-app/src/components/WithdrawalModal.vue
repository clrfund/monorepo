<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Withdraw funds</h3>
      <transaction
        :hash="withdrawalTxHash"
        :error="withdrawalTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 2">
      <h3>Success!</h3>
      <div>You have successfully withdrawn your contribution.</div>
      <button class="btn close-btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber } from 'ethers'

import { withdrawContribution } from '@/api/contributions'
import Transaction from '@/components/Transaction.vue'
import { formatAmount } from '@/utils/amounts'
import { waitForTransaction } from '@/utils/contracts'

@Component({
  components: {
    Transaction,
  },
})
export default class WithdrawalModal extends Vue {

  step = 1

  withdrawalTxHash = ''
  withdrawalTxError = ''

  created() {
    this.withdraw()
  }

  private async withdraw() {
    const signer = this.$store.state.currentUser.walletProvider.getSigner()
    const { fundingRoundAddress } = this.$store.state.currentRound
    try {
      await waitForTransaction(
        withdrawContribution(fundingRoundAddress, signer),
        (hash) => this.withdrawalTxHash = hash,
      )
    } catch (error) {
      this.withdrawalTxError = error.message
      return
    }
    this.step += 1
  }

  get contribution(): BigNumber {
    return this.$store.state.contribution
  }

  formatAmount(value: BigNumber): string {
    const { nativeTokenDecimals } = this.$store.state.currentRound
    return formatAmount(value, nativeTokenDecimals)
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.close-btn {
  margin-top: $modal-space;
}
</style>
