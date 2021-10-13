<template>
  <div class="etherscan-btn tx-receipt">
    <div class="status-label-address">
      <loader
        v-if="isPending"
        v-tooltip="'Awaiting transaction confirmation'"
        class="pending"
      />
      <img
        class="success"
        v-tooltip="'Transaction confirmed'"
        v-if="!isPending"
        src="@/assets/checkmark.svg"
      />
      <p class="hash">{{ renderCopiedOrHash }}</p>
    </div>
    <div class="actions">
      <links
        class="explorerLink"
        :to="blockExplorerUrl"
        v-tooltip="'View on Etherscan'"
        :hideArrow="true"
        ><img class="icon" src="@/assets/etherscan.svg"
      /></links>
      <copy-button
        :value="hash"
        text="hash"
        v-on:copied="updateIsCopied"
        myClass="icon"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import Loader from '@/components/Loader.vue'
import CopyButton from '@/components/CopyButton.vue'
import Links from '@/components/Links.vue'
import { chain } from '@/api/core'
import { isTransactionMined } from '@/utils/contracts'
import { renderAddressOrHash } from '@/utils/accounts'

@Component({
  components: { Loader, CopyButton, Links },
})
export default class TransactionReceipt extends Vue {
  isPending = true
  isCopied = false

  @Prop() hash!: string

  updateIsCopied(value: boolean): void {
    this.isCopied = value
  }

  created() {
    this.checkTxStatus()
  }

  get renderCopiedOrHash(): string {
    return this.isCopied ? 'Copied!' : renderAddressOrHash(this.hash, 16)
  }

  async checkTxStatus(): Promise<void> {
    while (this.isPending) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      const isMined = await isTransactionMined(this.hash)
      this.isPending = !isMined
    }
  }

  get blockExplorerUrl(): string {
    return `${chain.explorer}/tx/${this.hash}`
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.tx-receipt {
  display: flex;
  justify-content: space-between;
}

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

.explorerLink {
  padding: 0;
  margin: 0;
}
.status-label-address {
  display: flex;
  gap: 0.25rem;
  align-items: center;
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
