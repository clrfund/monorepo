<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <div v-if="walletProvider && !currentUser">
        <wallet-widget />
      </div>
      <div v-else>
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
          <button class="btn-secondary" @click="$emit('close')">Go back</button>
          <button class="btn-action" :disabled="!isAmountValid()" @click="contributeMatchingFunds()">Contribute</button>
        </div>
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
      <div style="font-size: 64px;">💦</div>
      <h3>You just topped up the pool by {{ amount }} {{ tokenSymbol }}!</h3>
      <div style="margin-bottom: 2rem;">Thanks for helping out all our projects.</div>
      <button class="btn-primary" @click="$emit('close')">Done</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber, Contract, Signer } from 'ethers'
import { parseFixed } from '@ethersproject/bignumber'
import WalletWidget from '@/components/WalletWidget.vue'
import Transaction from '@/components/Transaction.vue'
import { waitForTransaction } from '@/utils/contracts'

import { ERC20 } from '@/api/abi'
import { factory } from '@/api/core'
import { RoundStatus } from '@/api/round'

@Component({
  components: {
    Transaction,
    WalletWidget,
  },
})
export default class MatchingFundsModal extends Vue {

  step = 1

  signer!: Signer
  

  amount = '100'
  transferTxHash = ''
  transferTxError = ''

  amount = '100'
  transferTxHash = ''
  transferTxError = ''

  created() {
    this.signer = this.$store.state.currentUser.walletProvider.getSigner()
  }

  get walletProvider(): any {
    return (window as any).ethereum
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

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
    const { nativeTokenAddress, nativeTokenDecimals } = this.$store.state.currentRound
    const token = new Contract(nativeTokenAddress, ERC20, this.signer)
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
@import '../styles/theme';


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

.vm--modal {
  background-color: transparent !important;
}

.modal-body {
  background-color: $bg-primary-color;
  padding: $modal-space;
  text-align: center;
  box-shadow: $box-shadow;
  

  .loader {
    margin: $modal-space auto;
  }
}

</style>
