<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Round 4 has been cancelled</h3>
      <div>
        Please withdraw your contribution.
        Read the <a href="https://blog.clr.fund/round-4-review/" target="_blank" rel="noopener">blog post</a> for more information.
      </div>
      <button class="btn" @click="withdraw()">Continue</button>
    </div>
    <div v-if="step === 2">
      <h3>Withdraw funds</h3>
      <div>Unclean spirit! Withdraw your round 04 contribution!</div>
      <transaction
        :hash="withdrawalTxHash"
        :error="withdrawalTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 3">
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

  async withdraw() {
    const signer = this.$store.state.currentUser.walletProvider.getSigner()
    const fundingRoundAddress = '0x4a7242887b004E6C2919E8F040E5B3Cf3369Cd7C'
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

  formatAmount(value: BigNumber): string {
    return formatAmount(value, 18)
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.btn {
  margin-top: $modal-space;
}
</style>
