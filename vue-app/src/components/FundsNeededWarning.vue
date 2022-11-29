<template>
  <div :class="!isCompact && 'warning'" v-if="needsFunds">
    <span v-if="!isCompact">
      {{ $t('fundsNeededWarning.span1_t1') }}
      {{ chain.isLayer2 ? $t('fundsNeededWarning.span1_l2') : chain.label }}
      {{ $t('fundsNeededWarning.span1_t2') }}
    </span>
    <p v-if="!!singleTokenNeeded">
      {{ $t('fundsNeededWarning.p1') }}
    </p>
    <p @click="onNavigate" class="message">
      <links
        v-if="chain.isLayer2"
        :to="{
          name: 'about-layer-2',
          params: {
            section: 'bridge',
          },
        }"
      >
        {{
          $t('fundsNeededWarning.link1', {
            nativeTokenSymbol: nativeTokenSymbol,
          })
        }}
      </links>
      <links v-else :to="chain.bridge">
        {{
          $t('fundsNeededWarning.link2', {
            singleTokenNeeded: singleTokenNeeded,
            chain: chain.label,
          })
        }}
      </links>
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { BigNumber } from '@ethersproject/bignumber'
import { ChainInfo } from '@/plugins/Web3/constants/chains'
import { chain } from '@/api/core'
import { User } from '@/api/user'
import { formatAmount } from '@/utils/amounts'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class FundsNeededWarning extends Vue {
  @Prop() onNavigate!: () => void
  @Prop() isCompact!: boolean

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get chain(): ChainInfo {
    return chain
  }

  get nativeTokenSymbol(): string {
    return this.$store.getters.nativeTokenSymbol
  }

  get nativeTokenDecimals(): number | undefined {
    return this.$store.getters.nativeTokenDecimals
  }

  get tokenBalance(): number | null {
    if (!this.currentUser?.balance) return null
    return parseFloat(
      formatAmount(
        this.currentUser.balance as BigNumber,
        this.nativeTokenDecimals
      )
    )
  }

  get etherBalance(): number | null {
    if (!this.currentUser?.etherBalance) return null
    return parseFloat(formatAmount(this.currentUser.etherBalance as BigNumber))
  }

  get needsTokens(): boolean {
    return !this.$store.getters.hasUserContributed && this.tokenBalance === 0
  }

  get needsFunds(): boolean {
    return this.etherBalance === 0 || this.needsTokens
  }

  get singleTokenNeeded(): string {
    if (!this.currentUser) return ''
    const tokenNeeded = this.needsTokens
    const etherNeeded = this.etherBalance === 0
    if (tokenNeeded === etherNeeded) return ''
    // Only return string if either ETH or ERC-20 is zero balance, not both
    if (tokenNeeded) return this.nativeTokenSymbol
    return 'ETH'
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.warning {
  width: 100%;
  box-sizing: border-box;
  background: var(--warning-background);
  border-radius: 1rem;
  padding: 1rem;
  margin: 1rem 0 0;
  color: var(--warning-color);
}

.message {
  margin: 1.25rem 0 0;
  color: var(--text-color);
}
</style>
