<template>
  <div class="tx-container">
    <div class="recipient-submission-widget">
      <loader v-if="isLoading" />
      <!-- <div
        :class="
          isWaiting || txError
            ? 'tx-progress-area'
            : 'tx-progress-area-no-notice'
        "
      >
        <loader class="button-loader" v-if="isWaiting" />
        <div class="tx-notice">
          <div v-if="!!txHash">Waiting for transaction to be mined...</div>
          <div v-else>Check your wallet for a prompt...</div>
        </div>
        <div v-if="hasTxError" class="warning-icon">⚠️</div>
        <div v-if="hasTxError" class="warning-text">
          Something failed: {{ txError }}<br />
          Check your wallet or {{ blockExplorerLabel }} for more info.
        </div>
      </div> -->
      <div class="connected">
        <div
          class="text-base total-title"
          v-tooltip="{
            content:
              'Estimate – this total may be slightly different in your wallet.',
            trigger: 'hover click',
          }"
        >
          Total to submit
        </div>
        <div class="total">
          {{ depositAmount }}
          <span class="total-currency"> {{ depositToken }}</span>
        </div>
        <div class="subtitle warning-container" v-if="hasLowFunds">
          Not enough {{ depositToken }} in your wallet.<br />
          Top up or connect a different wallet.
        </div>
        <div v-if="txHasDeposit" class="checkout-row">
          <p class="subtitle m05"><b>Security deposit</b></p>
          <p class="text-base security-amount m05">
            {{ depositAmount }} {{ depositToken }}
            <span class="o5"
              >({{ fiatSign
              }}{{
                calculateFiatFee($store.state.recipientRegistryInfo.deposit)
              }})</span
            >
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { BigNumber } from 'ethers'
import { EthPrice, fetchCurrentEthPrice } from '@/api/price'
import { chain } from '@/api/core'

import Loader from '@/components/Loader.vue'
import Transaction from '@/components/Transaction.vue'

import { formatAmount } from '@/utils/amounts'

@Component({
  components: {
    Loader,
    Transaction,
  },
})
export default class RecipientSubmissionWidget extends Vue {
  @Prop() isWaiting!: boolean
  @Prop() txHash!: string
  @Prop() txError!: string
  isLoading = true
  ethPrice: EthPrice | null = null
  fiatFee = '-'
  fiatSign = '$'

  async created() {
    this.ethPrice = await fetchCurrentEthPrice()
    this.isLoading = false
  }

  get blockExplorerLabel(): string {
    return chain.explorerLabel
  }

  get hasTxError(): boolean {
    return !!this.txError
  }

  get txHasDeposit(): boolean {
    return !!this.$store.state.recipientRegistryInfo?.deposit
  }

  get depositAmount(): string {
    return this.$store.state.recipientRegistryInfo
      ? formatAmount(this.$store.state.recipientRegistryInfo.deposit, 18)
      : '...'
  }

  get hasLowFunds(): boolean {
    const { currentUser, recipientRegistryInfo } = this.$store.state

    if (currentUser?.etherBalance && recipientRegistryInfo?.deposit) {
      return currentUser.etherBalance.lt(recipientRegistryInfo.deposit)
    }
    return false
  }

  get depositToken(): string {
    return this.$store.state.recipientRegistryInfo?.depositToken ?? ''
  }

  public calculateFiatFee(ethAmount: BigNumber): string {
    if (this.$store.state.recipientRegistryInfo && this.ethPrice) {
      return Number(
        this.ethPrice.ethereum.usd * Number(formatAmount(ethAmount, 18))
      ).toFixed(2)
    }
    return '-'
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
  background: transparent;
  border-radius: 1rem;
  border: 1px solid $clr-dark-gray;
  align-items: center;
  justify-content: center;
  width: 75%;
  margin-top: 1rem;
  @media (max-width: $breakpoint-m) {
    width: 100%;
    margin-top: 0;
  }
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
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
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
  font-family: 'Work Sans';
  font-style: normal;
  font-weight: 700;
  font-size: 52px;
  line-height: 61px;
  margin-bottom: 1rem;
}

.checkout-row {
  width: 100%;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3rem;
  padding: 0.5rem 0;
  border-color: $clr-violet;
  border-style: solid;
  border-width: 1px 0px;

  @media (max-width: $breakpoint-m) {
    flex-direction: column;
    justify-content: flex-start;
  }
}

.m05 {
  margin: 0.5rem 0rem;
}

.security-amount {
  font-size: 24px;
  line-height: 28px;
}

.m2 {
  margin: 2rem 0rem;
}

.o5 {
  opacity: 0.5;
}

.total-currency {
  font-family: 'Work Sans';
  font-style: normal;
  font-weight: 700;
  font-size: 52px;
  line-height: 61px;
}

.total-title {
  font-size: 18px;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.warning-icon {
  font-size: 24px;
}

.warning-container {
  font-size: 14px;
  color: $clr-error;
  border: 2px solid $clr-error;
  border-radius: 20px;
  padding: 1.25rem 2.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 20px;
  line-height: 24px;
}

.warning-text,
.warning-icon {
  line-height: 150%;
  text-align: center;
}
</style>
