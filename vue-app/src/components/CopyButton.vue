<template>
  <tooltip v-if="text" :position="position || 'bottom'" :content="isCopied ? 'Copied!' : `Copy${type && ` ${type}`}`">
    <div :class="divClass || 'copy-btn'" @click="copyToClipboard">
      <img width="16px" src="@/assets/copy.svg" />
    </div>
  </tooltip>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import Tooltip from '@/components/Tooltip.vue'

@Component({ components: { Tooltip } })
export default class CopyButton extends Vue {  
  @Prop() text!: string // Required: Text to copy
  @Prop() type!: string // Optional: Fills in "Copy ____" in tooltip
  @Prop() position!: string // Optional: Position of tooltip (default "bottom")
  @Prop() divClass!: string
  @Prop() callback!: (value: boolean) => void

  isLoading = false
  isCopied = false

  async copyToClipboard (): Promise<void> {
    this.isLoading = true
    try {
      await navigator.clipboard.writeText(this.text)
      this.isLoading = false
      this.isCopied = true
      if (typeof this.callback !== 'undefined') {
        this.callback(true)
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
      this.isCopied = false
      if (typeof this.callback !== 'undefined') {
        this.callback(false)
      }
    } catch (error) {
      this.isLoading = false
      if (process.env.NODE_ENV !== "production") {
        /* eslint-disable-next-line no-console */
        console.warn('Error in copying text: ', error)
      }
    }
  }
}
</script>


<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.ipfs-copy-btn {
  width: 1rem;
  height: 1rem;
  padding: 0.25rem;
  cursor: pointer;
  &:hover {
    background: $bg-light-color;
    border-radius: 16px;
  }
}

.copy-btn {
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: 1px solid $text-color;
  padding: 0.5rem;
  box-sizing: border-box;
  padding: 0.25rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  &:hover {
    transform: scale(1.01);
    opacity: 0.8;
  }
}
</style>