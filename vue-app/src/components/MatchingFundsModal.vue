<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Contribute matching funds to the {{ isRoundFinished() ? 'next' : 'current' }} round</h3>
      <form class="contribution-form">
        <div>Please enter amount:</div>
        <input
          v-model="amount"
          class="input"
          :class="{ invalid: !isAmountValid() }"
          name="amount"
          placeholder="Amount"
        >
        <div>{{ tokenSymbol }}</div>
      </form>
      <div class="btn-row">
        <button class="btn" @click="$emit('close')">Go back</button>
        <button class="btn" :disabled="!isAmountValid()" @click="contributeMatchingFunds()">Continue</button>
      </div>
    </div>
    <div v-if="step === 2">
      <h3>Contribute matching funds to the {{ isRoundFinished() ? 'next' : 'current' }} round</h3>
      <transaction
        :hash="transferTxHash"
        :error="transferTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 3">
      <h3>Success!</h3>
      <div>Tokens has been sent to the matching pool.</div>
      <button class="btn close-btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber, Contract } from 'ethers'
import { parseFixed } from '@ethersproject/bignumber'

import Transaction from '@/components/Transaction.vue'
import { waitForTransaction } from '@/utils/contracts'

import { ERC20 } from '@/api/abi'
import { factory } from '@/api/core'
import { RoundStatus } from '@/api/round'

@Component({
  components: {
    Transaction,
  },
})
export default class MatchingFundsModal extends Vue {

  step = 1

  amount = '100'
  transferTxHash = ''
  transferTxError = ''

  isRoundFinished(): boolean {
    const { status } = this.$store.state.currentRound
    return [RoundStatus.Finalized, RoundStatus.Cancelled].includes(status)
  }

  isAmountValid(): boolean {
    const { nativeTokenDecimals } = this.$store.state.currentRound
    let amount
    try {
      amount = parseFixed(this.amount, nativeTokenDecimals)
    } catch {
      return false
    }
    if (amount.lte(BigNumber.from(0))) {
      return false
    }
    return true
  }

  get tokenSymbol(): string {
    return this.$store.state.currentRound.nativeTokenSymbol
  }

  async contributeMatchingFunds() {
    this.step += 1
    const signer = this.$store.state.currentUser.walletProvider.getSigner()
    const { nativeTokenAddress, nativeTokenDecimals } = this.$store.state.currentRound
    const token = new Contract(nativeTokenAddress, ERC20, signer)
    const amount = parseFixed(this.amount, nativeTokenDecimals)
    try {
      await waitForTransaction(
        token.transfer(factory.address, amount),
        (hash) => this.transferTxHash = hash,
      )
    } catch (error) {
      this.transferTxError = error.message
      return
    }
    this.step += 1
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.contribution-form {
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-top: $modal-space;

  input {
    margin: 0 7px;
    width: 100px;
  }
}

.btn-row {
  margin: $modal-space auto 0;

  .btn {
    margin: 0 $modal-space;
  }
}

.close-btn {
  margin-top: $modal-space;
}

</style>
