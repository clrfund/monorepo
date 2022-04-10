<template>
  <div class="copy">
    <div class="address">
      {{ renderCopiedOrAddress }}
    </div>
    <div class="icons">
      <links
        v-if="chainId"
        class="explorerLink"
        :to="blockExplorer.url"
        v-tooltip="`View on ${blockExplorer.label}`"
        :hideArrow="true"
      >
        <img class="icon" :src="require(`@/assets/${blockExplorer.logo}`)" />
      </links>
      <copy-button
        :value="address"
        text="address"
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

import { CHAIN_INFO } from '@/plugins/Web3/constants/chains'
import CopyButton from '@/components/CopyButton.vue'
import Links from '@/components/Links.vue'

@Component({
  components: { CopyButton, Links },
})
export default class AddressWidget extends Vue {
  @Prop() address!: string
  @Prop() chainId!: number
  isCopied = false

  updateIsCopied(isCopied: boolean): void {
    this.isCopied = isCopied
  }

  get renderCopiedOrAddress(): string {
    return this.isCopied ? 'Copied!' : this.address
  }

  get blockExplorer(): {
    label: string
    url: string
    logo: string
    chainName: string
  } {
    const chain = CHAIN_INFO[this.chainId]
    return {
      label: chain.explorerLabel,
      url: `${chain.explorer}/address/${this.address}`,
      logo: chain.explorerLogo,
      chainName: chain.name,
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
  min-width: 0;
  max-width: 100%;
  font-weight: 500;
  width: fit-content;
  @media (max-width: $breakpoint-m) {
    width: 100%;
  }
}

.address {
  padding: 0.5rem;
  font-size: 14px;
  font-weight: 500;
  line-height: 150%;
  align-items: center;
  gap: 1rem;
  width: 100%;
  min-width: 10%;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: $breakpoint-m) {
    margin-left: 0.5rem;
  }
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
  @include icon(none, $bg-light-color);
}
</style>
