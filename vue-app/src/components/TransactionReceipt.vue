<template>
  <div class="etherscan-btn">
      <div class="status-label-address">
        <loader v-if="pending" class="pending" />
        <!-- TODO: add tooltip for pending -->
        <img class="success" v-if="success" src="@/assets/checkmark.svg" />
        <!-- <p class="hash-label">TX</p> -->
        <p class="hash">{{renderTxHash(8)}}</p>
      </div>
      <div class="actions">
        <a style="padding: 0; margin: 0;" :href="'https://etherscan.io/tx/' + txHash" target="_blank" title="View on Etherscan"><img class="icon" src="@/assets/etherscan.svg" /></a>
        <div @click="copyAddress" class="icon"><img style="width: 100%;" src="@/assets/copy.svg" /></div>
      </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Loader from '@/components/Loader.vue'
import { blockExplorer } from '@/api/core'

@Component({
  components: { Loader },
})
export default class TransactionReceipt extends Vue { 
  pending = false
  success = true
  txHash = '0xfakehashf7261d65be24e7f5cabefba4a659e1e2e13685cc03ad87233ee2713d'
  
  async copyAddress(): Promise<void> {
    if (!this.txHash) { return }
    try {
      await navigator.clipboard.writeText(this.txHash)
      // alert('Text copied to clipboard')
    } catch (error) {
      console.warn('Error in copying text: ', error) /* eslint-disable-line no-console */
    }
  }
  
  renderTxHash(digitsToShow?: number): string {
    if (this.txHash) {
      const txHash: string = this.txHash
      if (digitsToShow) {
        const beginDigits: number = Math.ceil(digitsToShow / 2)
        const endDigits: number = Math.floor(digitsToShow / 2)
        const begin: string = txHash.substr(0, 2 + beginDigits)
        const end: string = txHash.substr(txHash.length - endDigits, endDigits)
        return `${begin}…${end}`
      }
      return txHash
    }
    return ''
  }
  
  get blockExplorerUrl(): string {
    return `${blockExplorer}${this.txHash}`
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.icon {
  width: 1rem;
  height: 1rem;
  padding: 0.25rem;
  cursor: pointer;
  &:hover {
      background: $clr-pink-light-gradient;
      border-radius: 16px;
  }
}

.hash {
  color: #fff;
  margin: 0;
  font-size: 14px;
  text-transform: uppercase;
  font-weight: 500;
}

.success {
  width: 0.75rem;
  height: 0.75rem;
  padding: 0.25rem;
  margin-right: 0.25rem;
  background: $clr-pink-light-gradient;
  border-radius: 2rem;
}

.actions {
  display: flex;
  gap: 0.25rem;
  height: 1.5rem;
}

.status-label-address {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.etherscan-btn {
  background: $clr-pink-light-gradient-inactive;
  box-shadow: $box-shadow;
  justify-content: space-between;
  align-items: center;
  display: flex;
  gap: 0.5rem;
  border-radius: 32px;
  padding: 0.25rem;
  padding-left: 0.5rem;
  
  font-weight: 500;
  margin-bottom: 2rem;
  width: fit-content;
}

.pending {
  margin: 0.25rem;
  padding: 0;
  width: 1rem;
  height: 1rem;
}

.pending:after {
  width: 0.75rem;
  height: 0.75rem;
  margin: 0;
  border-radius: 50%;
  border: 2px solid $clr-pink;
  border-color: $clr-pink transparent $clr-pink transparent;
}
</style>

