<template>
  <div
    v-tooltip="{
      content: isCopied ? 'Copied!' : `Copy${text && ` ${text}`}`,
      hideOnTargetClick: false,
      trigger: 'hover click',
    }"
    :class="`${myClass || 'copy-icon'} ${hasBorder && 'border'}`"
    @click="copyToClipboard"
  >
    <img width="16px" src="@/assets/copy.svg" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component
export default class CopyButton extends Vue {
  @Prop() value!: string // Required: Text to copy
  @Prop() text!: string // Optional: Fills in "Copy ____" in tooltip
  @Prop() position!: string // Optional: Position of tooltip (default "bottom")
  @Prop() myClass!: string // Optional class override for custom styling
  @Prop() hasBorder!: boolean

  isLoading = false
  isCopied = false

  async copyToClipboard(): Promise<void> {
    this.isLoading = true
    try {
      await navigator.clipboard.writeText(this.value)
      this.isLoading = false
      this.isCopied = true
      this.$emit('copied', true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      this.isCopied = false
      this.$emit('copied', false)
    } catch (error) {
      this.isLoading = false
      if (process.env.NODE_ENV !== 'production') {
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

.copy-icon {
  @include icon(none, none);
}

.ipfs-copy-widget,
.project-profile {
  @include icon(none, var(--bg-light-color));
}

.profile {
  @include icon(rgba(white, 0.1), rgba(white, 0.2));
  padding: 0.5rem;
}

.border {
  border: 1px solid var(--text-color);
}

img {
  filter: var(--img-filter, invert(0.7));
}
</style>
