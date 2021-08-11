<template>
  <div class="copy">
    <div class="hash">
      {{ renderCopiedOrHash }}
    </div>
    <div class="icons">
      <copy-button
        :value="hash"
        text="hash"
        v-on:copied="updateIsCopied"
        myClass="ipfs-copy-widget"
      />
      <tooltip position="bottom" content="View IPFS link">
        <links :to="'https://ipfs.io/ipfs/' + hash">
          <img class="icon" src="@/assets/ipfs-white.svg" />
        </links>
      </tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import Tooltip from '@/components/Tooltip.vue'
import CopyButton from '@/components/CopyButton.vue'
import Links from '@/components/Links.vue'

@Component({
  components: { CopyButton, Tooltip, Links },
})
export default class IpfsCopyWidget extends Vue {
  @Prop() hash!: string
  isCopied = false

  updateIsCopied(isCopied: boolean): void {
    this.isCopied = isCopied
  }

  get renderCopiedOrHash(): string {
    return this.isCopied ? 'Copied!' : this.hash
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
}

.hash {
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
  @include icon(none, $bg-light-color);
}
</style>
