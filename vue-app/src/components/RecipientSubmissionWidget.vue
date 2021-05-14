<template>
  <div class="tx-container">
    <div :class="isWaiting || isPending ? 'recipient-submission-widget shine' : 'recipient-submission-widget'">
      <loader v-if="isLoading"/>
      <wallet-widget class="m2" v-if="!currentUser"/>
      <div v-if="currentUser" :class="isWaiting || isPending || txError ? 'tx-progress-area' : 'tx-progress-area-no-notice'">
          <loader class="button-loader" v-if="isWaiting || isPending || isWrongNetwork"/>
          <div v-if="isWaiting" class="tx-notice">
            Check your wallet for a prompt...
          </div>
          <div v-if="hasLowFunds || hasTxError || isTxRejected" class="input-notice" style="font-size: 24px; margin-bottom: 0;">
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
      <div class="connected" v-if="currentUser">
        <div v-if="txHasDeposit" class="checkout-row">
          <p class="m05"><b>Security deposit</b></p>
          <p class="m05">{{ depositAmount }} {{ depositToken }} <span class="o5">({{fiatSign}}{{fiatFee}})</span> </p>
        </div>
        <div class="checkout-row">
          <p class="m05"><b>Estimated transaction fee</b></p>
          <p class="m05">{{txFee}} {{feeToken}} <span class="o5">({{fiatSign}}{{fiatFee}})</span> </p>
        </div>
        <div class="cta">
          <button
            @click="handleSubmit"
            :class="isWaiting || isPending ? 'btn-action-disabled' : 'btn-action'"
            :disabled="!canSubmit"
          >
            <div v-if="isWaiting || isPending"><loader class="button-loader"/> </div>
            <div v-else>Submit project</div>
          </button>
        </div>
        <!-- TODO display conditionally -->
        <transaction v-if="isPending" :hash="txHash" :error="txError"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import {
  addRecipient,
  getRegistryInfo,
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
  isLoading = false
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

  get txHasDeposit(): boolean {
    return !!this.registryInfo?.deposit
  }

  get depositAmount(): string {
    return this.registryInfo ? formatAmount(this.registryInfo.deposit, 18) : '...'
  }

  get depositToken(): string {
    return this.registryInfo?.depositToken
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
    // Check out Launchpad repo to view transaction states
    this.isWaiting = true
    try {
      await waitForTransaction(
        addRecipient(recipientRegistryAddress, recipient, registryInfo.deposit, signer),
        (hash) => this.txHash = hash,
      )
    } catch (error) {
      this.isWaiting = false
      this.txError = error.message
      return
    }
    this.isWaiting = false

    this.$router.push({
      name: 'projectAdded',
      params: {
        txHash: this.txHash,
      },
    })
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';


.tx-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.recipient-submission-widget {
  display: flex;
  flex-direction: column;
  background: $bg-primary-color;
  border-radius: 1rem;
  border: 1px solid #000;
  align-items: center;
  justify-content: center;
  width: 75%;
  margin-top: 1rem;
  @media (max-width: $breakpoint-m) {
    width: 100%;
    margin-top: 0;
  }
}


.shine {
  background: $bg-primary-color;
  background-image: linear-gradient(to right, $bg-primary-color 0%, $bg-secondary-color 10%, $bg-primary-color 40%, $bg-primary-color 100%);
  background-repeat: repeat;
  position: relative; 
  
  -webkit-animation-duration: 8s;
  -webkit-animation-fill-mode: forwards; 
  -webkit-animation-iteration-count: infinite;
  -webkit-animation-name: placeholderShimmer;
  -webkit-animation-timing-function: linear;
  }

@-webkit-keyframes placeholderShimmer {
  0% {
    background-position: calc(-100vw) 0;
  }
  
  100% {
    background-position: calc(100vw) 0; 
  }
}

.connected {
  width: 75%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tx-progress-area {
  background: $clr-pink-light-gradient-inactive;
  text-align: center;
  border-radius: calc(1rem - 1px) calc(1rem - 1px) 0 0;
  padding: 1.5rem;
  width: -webkit-fill-available;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
  font-weight: 500;
}

.tx-progress-area-no-notice {
  background: $clr-pink-light-gradient-inactive;
  text-align: center;
  border-radius: calc(3rem - 1px) calc(3rem - 1px) 0 0;
  width: -webkit-fill-available;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
  font-weight: 500;
  height: 1rem;
}

.checkout-row {
  width: 100%;
  text-align: center;
    @media (max-width: $breakpoint-m) {
    flex-direction: column;
    justify-content: flex-start;
  }
}

.m05 {
  margin: 0.5rem 0rem;
}


.m2 {
  margin: 2rem 0rem;
}

.o5 {
  opacity: 0.5;
}


.cta {
  margin: 2rem 0rem;
  margin-bottom: 2rem;
}

.btn-action-disabled {
  @include button(white, $clr-pink-light-gradient, none);
  opacity: 0.4;
  cursor: not-allowed;
}

</style>
