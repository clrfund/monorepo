<template>
  <div class="center-container">
    <div>
      <p>🎉 Transaction completed successfully!</p>
      <transaction-receipt :hash="hash" :chain="chain" />
    </div>
    <div class="mt2" v-for="(btn, index) in buttons" :key="index">
      <links
        :to="btn.url"
        :class="index === 0 ? 'btn-primary' : 'btn-secondary'"
      >
        {{ btn.text }}
      </links>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import { ChainInfo } from '@/plugins/Web3/constants/chains'
import { LinkInfo } from '@/api/types'
import { chain } from '@/api/core'
import TransactionReceipt from '@/components/TransactionReceipt.vue'
import Links from '@/components/Links.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'

@Component({
  components: {
    TransactionReceipt,
    Links,
    ImageResponsive,
  },
})
export default class TransactionResult extends Vue {
  @Prop() hash!: string
  @Prop() buttons!: LinkInfo[]

  get chain(): ChainInfo {
    return chain
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.emoji {
  font-size: 20px;
}

.center-container {
  width: 100%;
  display: grid;
  justify-content: center;
}
</style>
