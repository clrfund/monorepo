<template>
  <div class="warning" v-if="needsFunds">
    You need L2 funds!
    <p v-if="!!singleTokenNeeded">
      ⚠️ You need both some ETH for gas, and {{ nativeTokenSymbol }} to
      contribute
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
        Get help bridging {{ singleTokenNeeded }} to Layer 2
      </links>
      <links v-else :to="chain.bridge">
        Bridge {{ singleTokenNeeded }} to Layer 2
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

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get chain(): ChainInfo {
    return chain
  }

  get nativeTokenSymbol(): string {
    const { nativeTokenSymbol } = this.$store.state.currentRound
    return nativeTokenSymbol
  }

  get nativeTokenDecimals(): string {
    const { nativeTokenDecimals } = this.$store.state.currentRound
    return nativeTokenDecimals
  }

  get tokenBalance(): number | null {
    if (!this.currentUser) return null
    return parseFloat(
      formatAmount(
        this.currentUser.balance as BigNumber,
        this.nativeTokenDecimals
      )
    )
  }

  get etherBalance(): number | null {
    if (!this.currentUser) return null
    return parseFloat(formatAmount(this.currentUser.etherBalance as BigNumber))
  }

  get needsFunds(): boolean {
    return this.etherBalance === 0 || this.tokenBalance === 0
  }

  get singleTokenNeeded(): string {
    if (!this.currentUser) return ''
    const tokenNeeded = this.tokenBalance === 0
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
  background: $bg-primary-color;
  border-radius: 1rem;
  padding: 1rem;
  margin: 1rem 0 0;
  color: $warning-color;
}

.message {
  margin: 1.25rem 0 0;
  color: $text-color;
}
</style>
