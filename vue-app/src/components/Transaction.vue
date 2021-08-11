<template>
  <div class="transaction">
    <template v-if="error">
      <div class="error">{{ error }}</div>
      <button class="btn-secondary close-btn" @click="$emit('close')">
        Close
      </button>
    </template>
    <template v-else>
      <div v-if="!hash">Please approve transaction in your wallet</div>
      <div v-if="hash">
        Waiting for
        <links :to="getBlockExplorerUrl(hash)">transaction</links> to confirm...
      </div>
      <loader />
      <div v-if="displayWarning">
        <small class="warning-text">
          If you have been waiting a while, consider refreshing your browser and
          reconnecting your wallet.
        </small>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Loader from '@/components/Loader.vue'
import Links from '@/components/Links.vue'

import { blockExplorer } from '@/api/core'

@Component({
  components: {
    Loader,
    Links,
  },
  watch: {
    hash: {
      handler: function () {
        // Every time the hash changes, restart the timer to display the warning
        // message to the user
        clearTimeout(this.$data.waitingWarningTimeout)
        this.$data.displayWarning = false

        this.$data.waitingWarningTimeout = setTimeout(() => {
          this.$data.displayWarning = true
        }, 30000)
      },
      immediate: true,
    },
  },
})
export default class Transaction extends Vue {
  waitingWarningTimeout
  displayWarning = false

  @Prop()
  hash!: string

  @Prop()
  error!: string

  getBlockExplorerUrl(transactionHash: string): string {
    return `${blockExplorer}${transactionHash}`
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.error {
  color: $error-color;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-btn {
  margin-top: 20px;
}
</style>
