<template>
  <div class="tx-container">
    <div>
      <loader v-if="isLoading" />
      <wallet-widget class="m2" v-if="!currentUser" />
      <div v-if="currentUser">
        <div v-if="isWaiting" class="mt2">
          <div v-if="progress">
            Waiting for block {{ progress.latest }} / {{ progress.total }}...
          </div>
          <div v-else>Check your wallet for a prompt...</div>
        </div>
        <div v-if="hasTxError || isTxRejected" class="warning-icon">⚠️</div>
        <div v-if="hasTxError" class="warning-text">
          Something failed: {{ txError }}<br />
          Check your wallet or {{ blockExplorerLabel }} for more info.
        </div>
        <div v-if="isTxRejected" class="warning-text">
          You rejected the transaction in your wallet
        </div>
      </div>
      <div class="connected" v-if="currentUser">
        <div class="cta">
          <button
            @click="handleSubmit"
            class="btn-action"
            :disabled="!canSubmit || isWaiting"
          >
            <div v-if="isWaiting">
              <loader class="button-loader" />
            </div>
            <div v-else>Submit</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { Web3Provider } from '@ethersproject/providers'
import { MetadataFormData, Metadata } from '@/api/metadata'
import { User } from '@/api/user'
import { chain } from '@/api/core'

import Loader from '@/components/Loader.vue'
import Transaction from '@/components/Transaction.vue'
import WalletWidget from '@/components/WalletWidget.vue'

import { waitForTransaction } from '@/utils/contracts'
import { ContractTransaction, ContractReceipt } from '@ethersproject/contracts'

type Progress = {
  latest: number
  total: number
}

@Component({
  components: {
    Loader,
    Transaction,
    WalletWidget,
  },
})
export default class MetadataSubmissionWidget extends Vue {
  @Prop() buttonLabel!: string
  @Prop() form!: MetadataFormData
  @Prop() onSubmit!: (
    form: MetadataFormData,
    provider: any
  ) => Promise<ContractTransaction>
  @Prop() onSuccess!: (receipt: ContractReceipt, chainId: number) => void

  isLoading = true
  isWaiting = false
  isTxRejected = false
  txHash = ''
  txError = ''
  progress: Progress | null = null

  async created() {
    this.isLoading = false
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get walletProvider(): Web3Provider | undefined {
    return this.$web3.provider
  }

  get blockExplorerLabel(): string {
    return chain.explorerLabel
  }
  get canSubmit(): boolean {
    return !!this.currentUser && !!this.walletProvider
  }

  get hasTxError(): boolean {
    return !!this.txError
  }

  updateProgress(latest: number, total: number): void {
    console.log('updating progress....', latest, total)
    this.progress = { latest, total }
  }

  async handleSubmit(): Promise<void> {
    const { currentUser } = this.$store.state

    // Reset errors when submitting
    this.txError = ''
    this.isTxRejected = false
    if (currentUser) {
      const { walletProvider } = currentUser
      try {
        this.isWaiting = true
        const transaction = this.onSubmit(this.form, walletProvider)
        const receipt = await waitForTransaction(
          transaction,
          (hash) => (this.txHash = hash)
        )

        await Metadata.waitForBlock(
          receipt.blockNumber,
          chain.name,
          0,
          this.updateProgress
        )
        this.isWaiting = false

        if (this.onSuccess) {
          this.onSuccess(receipt, this.$web3.chainId)
        }
      } catch (error) {
        this.isWaiting = false
        this.txError = error.message
        return
      }
    }
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
  background-image: linear-gradient(
    to right,
    $bg-primary-color 0%,
    $bg-secondary-color 10%,
    $bg-primary-color 40%,
    $bg-primary-color 100%
  );
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

.total {
  font-size: 64px;
  font-weight: 700;
  font-family: 'Glacial Indifference', sans-serif;
  overflow-wrap: break-word;
  width: 100%;
  text-align: center;
  line-height: 100%;
  margin-bottom: 1rem;
}

.checkout-row {
  width: 100%;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.total-currency {
  font-size: 48px;
}

.total-title {
  color: white;
  font-size: 16px;
  font-weight: 400;
  line-height: 100%;
  text-transform: uppercase;
  justify-content: flex-start;
  align-items: center;
  display: flex;
  width: fit-content;
  padding: 0.5rem;
  background: $bg-light-color;
  border-radius: 2rem;
  gap: 0.25rem;
  margin-bottom: 0.5rem;

  img {
    width: 16px;
    height: 16px;
  }
}

.btn-action-disabled {
  @include button(white, $clr-pink-light-gradient, none);
  opacity: 0.4;
  cursor: not-allowed;
}

.warning-icon {
  font-size: 24px;
}

.warning-text {
  font-size: 14px;
}

.warning-text,
.warning-icon {
  line-height: 150%;
  color: $warning-color;
  text-transform: uppercase;
  text-align: center;
}
</style>
