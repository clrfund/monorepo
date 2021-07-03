<template>
  <tooltip v-if="text" :position="position || 'bottom'" :content="isCopied ? 'Copied!' : `Copy${type && ` ${type}`}`">
    <div :class="myClass || 'button'" @click="copyToClipboard">
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
  @Prop() myClass!: string // Optional class override for custom styling
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

@mixin icon($bg, $bg-hover) {
  width: 1rem;
  height: 1rem;
  border-radius: 1rem;
  padding: 0.25rem;
  cursor: pointer;
  background: $bg;
  &:hover {
    background: $bg-hover;
  }
}

.tx-receipt {
  @include icon(none, $clr-pink-light-gradient);
}

.ipfs-copy-widget {
  @include icon(none, $bg-light-color);
}

.button {
  @include icon(rgba(#FFF, 0.1), rgba(#FFF, 0.1));
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  border: 1px solid $text-color;
  &:hover {
    transform: scale(1.01);
    opacity: 0.8;
  }
}
</style>