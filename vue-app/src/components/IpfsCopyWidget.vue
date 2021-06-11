<template>
  <div class="copy">
    <div class="hash">
      <loader class="hash-loader" v-if="isLoading" />
      <div class="hash-text" v-else>{{ renderCopiedOrHash }}</div>
    </div>
    <div class="icons">
      <tooltip position="bottom" :content="isCopied ? 'Copied!' : 'Copy hash'"><div class="icon" @click="copyHash"><img width="16px" src="@/assets/copy.svg" /></div></tooltip>
      <tooltip position="bottom" content="View IPFS link"><a class="icon" :href="'https://ipfs.io/ipfs/' + hash" target="_blank"><img width="16px" src="@/assets/ipfs-white.svg" /></a></tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import Tooltip from '@/components/Tooltip.vue'

@Component({
  components: { Tooltip },
})
export default class IpfsCopyWidget extends Vue {
  @Prop() hash!: string
  isLoading = false
  isCopied = false

  get renderCopiedOrHash(): string {
    return this.isCopied ? 'Copied!' : this.hash
  }

  async copyHash(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.hash)
      this.isCopied = true
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.isCopied = false
    } catch (error) {
      console.warn('Error in copying text: ', error) /* eslint-disable-line no-console */
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.copy {
  background: $bg-primary-color;
  justify-content: space-between;
  align-items: center;
  display: flex;
  gap: 0.5rem;
  border-radius: 32px;
  padding: 0.25rem 0.5rem;
  flex-grow: 1;
  min-width: 47%;
  max-width: 530px;
  font-weight: 500;
  width: fit-content;
}

.hash {
  padding: 0.5rem;
  font-size: 14px;
  font-weight: 500;
  line-height: 150%;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 10%;
  text-transform: uppercase;
    @media (max-width: $breakpoint-m) {
    margin-left: 0.5rem;
  }
}

.hash-loader {
    margin: 0.25rem;
    padding: 0;
    width: 1rem;
    height: 1rem;
}
.hash-loader:after {
    width: 0.75rem;
    height: 0.75rem;
    margin: 0;
    border-radius: 50%;
    border: 2px solid #fff;
    border-color: #fff transparent #fff transparent;
}

.icons {
  display: flex;
  align-items: center;
  gap: 0.25rem;  
  @media (max-width: $breakpoint-m) {
    width: fit-content;
    margin-right: 1rem;
    gap: 0.5rem;
  }
}

.icon {
    width: 1rem;
    height: 1rem;
    padding: 0.25rem;
    cursor: pointer;
    &:hover {
        background: $bg-light-color;
        border-radius: 16px;
    }
}

.hash-text {
  white-space: nowrap; 
  overflow: hidden;
  width: 100%;
  text-overflow: ellipsis; 
}
</style>