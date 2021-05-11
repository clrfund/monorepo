<template>
  <div>
    <loader v-if="isLoading"/>
    <div v-else>
      Required security deposit: {{ formatAmount(registryInfo.deposit) }} {{ registryInfo.depositToken }}.
    </div>
    <wallet-widget />
    <div class="tx-progress-area">
      <loader v-if="isWaiting || isPending || isWrongNetwork"/>
      <div v-if="isWaiting" class="tx-notice">
        Check your wallet for a prompt...
      </div>
      <div v-if="hasLowFunds || hasTxError || isTxRejected" class="input-notice" style="font-size: 40px; margin-bottom: 0;">
        ⚠️
      </div>
      <div v-if="hasLowFunds" class="input-notice">
        Not enough ETH in your wallet.<br /> Top up or connect a different wallet.
      </div>
      <div v-if="hasTxError" class="input-notice">
        Something failed: {{txError}}<br /> Check your wallet or Etherscan for more info.
      </div>
      <div v-if="isTxRejected" class="input-notice">
        You rejected the transaction in your wallet
      </div>
      <div v-if="isWrongNetwork" class="input-notice">
        We're on Optimism Network.<br /> Switch over to the right network in your wallet.
      </div>
      <div v-if="isPending">
        <div class="tx-notice">Sending deposit...</div>
        <a href="#" class="tx-notice">Follow on Etherscan <img width="16px" src="@/assets/etherscan.svg"/></a>
      </div>
    </div>
    <div class="checkout-row">
        <p class="m0"><b>Estimated transaction fee</b></p>
        <p class="m0">{{txFee}} {{feeToken}} ({{fiatSign}}{{fiatFee}}) </p>
    </div>
    <button
      @click="handleSubmit"
      class="app-btn"
      :disabled="!canSubmit"
    >
      Submit project
    </button>
    <!-- TODO display conditionally -->
    <transaction v-if="isPending" :hash="txHash" :error="txError"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber } from 'ethers'

import {
  addRecipient,
  getRegistryInfo,
  getRequestId,
  RegistryInfo,
} from '@/api/recipient-registry-optimistic'
import { User } from '@/api/user'
import { Web3Provider } from '@ethersproject/providers'

import Loader from '@/components/Loader.vue'
import Transaction from '@/components/Transaction.vue'
import WalletWidget from '@/components/WalletWidget.vue'

import { formatAmount } from '@/utils/amounts'
import { waitForTransaction } from '@/utils/contracts'

@Component({
  components: {
    Loader,
    Transaction,
    WalletWidget,
  },
})
export default class RecipientSubmissionWidget extends Vue {
  isLoading = true
  isWaiting = false // TODO add logic
  isPending = false // TODO add logic
  isWrongNetwork = false  // TODO remove? WalletWidget can handle this?
  isTxRejected = false // TODO add logic
  txHash = ''
  txError = ''
  // TODO
  txFee = '0.00006' // TODO add logic
  hasLowFunds = false // TODO add logic
  feeToken = 'ETH' // TODO add logic
  fiatFee = '1.04' // TODO add logic
  fiatSign = '$' // TODO add logic

  registryInfo: RegistryInfo | null = null
  recipientId = ''

  async created() {
    this.registryInfo = await getRegistryInfo(this.$store.state.recipientRegistryAddress)
    this.isLoading = false
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }
  
  get walletProvider(): Web3Provider | undefined {
    return this.currentUser?.walletProvider
  }

  get canSubmit(): boolean {
    return !!this.currentUser && !!this.walletProvider && !!this.registryInfo
  }

  get hasTxError(): boolean {
    return !!this.txError
  }

  formatAmount(value: BigNumber): string {
    return formatAmount(value, 18)
  }

  handleSubmit(): void {
    this.addRecipient()
  }

  private async addRecipient() {
    // TODO move to create()?
    const recipientRegistryAddress = this.$store.state.recipientRegistryAddress
    const signer = this.$store.state.currentUser.walletProvider.getSigner()
    const recipient = this.$store.state.recipient
    // TODO use this.registryInfo
    const registryInfo = await getRegistryInfo(this.$store.state.recipientRegistryAddress)

    // TODO where to make `isPending` vs. `isWaiting`? In `waitForTransaction`?
    this.isWaiting = true
    let submissionTxReceipt
    try {
      console.log('TRYING')
      submissionTxReceipt = await waitForTransaction(
        addRecipient(recipientRegistryAddress, recipient, registryInfo.deposit, signer),
        (hash) => this.txHash = hash,
      )
    } catch (error) {
      this.isWaiting = false
      this.txError = error.message
      console.log('txError: ', this.txError)
      return
    }
    this.isWaiting = false
    this.recipientId = getRequestId(submissionTxReceipt, recipientRegistryAddress)
    console.log(this.recipientId)

    this.$router.push({
      name: 'projectAdded',
      params: {
        txHash: this.txHash,
      },
    })

    // TODO transition user to success step
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.checkout-row {
  display: flex;
  justify-content: space-between;
  margin: 2rem 0;
    @media (max-width: $breakpoint-m) {
    flex-direction: column;
    justify-content: flex-start;
    margin: 1rem 0;
  }
}
</style>
