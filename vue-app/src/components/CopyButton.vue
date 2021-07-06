<template>
  <tooltip
    v-if="text"
    :position="position || 'bottom'"
    :content="isCopied ? 'Copied!' : `Copy${type && ` ${type}`}`"
  >
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

.tx-receipt {
  @include icon(none, $clr-pink-light-gradient);
}

.ipfs-copy-widget {
  @include icon(none, $bg-light-color);
}

.project-profile {
  @include icon(none, $clr-green-gradient);
}

.profile {
  @include icon(rgba(white, 0.1), rgba(white, 0.2));
  border: 1px solid $text-color;
  padding: 0.5rem;
}
</style>