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
        <a :href="getBlockExplorerUrl(hash)" target="_blank">transaction</a> to
        confirm...
      </div>
      <loader />
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Loader from '@/components/Loader.vue'

import { blockExplorer } from '@/api/core'

@Component({
  components: {
    Loader,
  },
})
export default class Transaction extends Vue {
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
