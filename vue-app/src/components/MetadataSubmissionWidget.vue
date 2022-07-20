<template>
  <div class="tx-container">
    <div v-if="currentUser">
      <div>
        <div v-if="isWaiting" class="mt2">
          <div v-if="progress">
            Waiting for block {{ progress.current }} of {{ progress.last }}...
          </div>
          <div v-else>Check your wallet for a prompt...</div>
        </div>
        <div v-if="hasTxError" class="warning-icon">⚠️</div>
        <div v-if="hasTxError" class="warning-text">
          Something failed: {{ txError }}<br />
          Check your wallet or {{ blockExplorerLabel }} for more info.
        </div>
      </div>
      <div class="connected">
        <div class="cta">
          <div v-if="isWaiting">
            <loader class="button-loader" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { MetadataFormData } from '@/api/metadata'
import { User } from '@/api/user'
import { chain, TransactionProgress } from '@/api/core'

import Loader from '@/components/Loader.vue'
import Transaction from '@/components/Transaction.vue'
import WalletWidget from '@/components/WalletWidget.vue'

import { ContractTransaction, ContractReceipt } from '@ethersproject/contracts'

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
  @Prop() isWaiting!: boolean
  @Prop({ default: null }) progress!: TransactionProgress | null
  @Prop({ default: '' }) txHash!: string
  @Prop({ default: '' }) txError!: string

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get blockExplorerLabel(): string {
    return chain.explorerLabel
  }

  get hasTxError(): boolean {
    return !!this.txError
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
  background: var(--bg-primary-color);
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
  background: var(--bg-primary-color);
  background-image: linear-gradient(
    to right,
    var(--bg-primary-color) 0%,
    var(--bg-secondary-color) 10%,
    var(--bg-primary-color) 40%,
    var(--bg-primary-color) 100%
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
  background: var(--bg-inactive);
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
  background: var(--bg-inactive);
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
  background: var(--bg-light-color);
  border-radius: 2rem;
  gap: 0.25rem;
  margin-bottom: 0.5rem;

  img {
    width: 16px;
    height: 16px;
  }
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
  color: var(--attention-color);
  text-transform: uppercase;
  text-align: center;
}
</style>
