<template>
  <div :class="{ container: !isActionButton }">
    <button
      v-if="!currentUser"
      :class="{
        'btn-action': isActionButton,
        'app-btn': !isActionButton,
        'full-width-mobile': fullWidthMobile,
      }"
      @click="showModal()"
    >
      Connect
    </button>
    <div
      v-else-if="currentUser && !isActionButton"
      class="profile-info"
      @click="toggleProfile"
    >
      <div class="profile-info-balance">
        <img v-if="showEth" :src="require(`@/assets/${chainCurrencyLogo}`)" />
        <img v-else :src="require(`@/assets/${tokenLogo}`)" />
        <div v-if="showEth" class="balance">{{ etherBalance }}</div>
        <div v-else class="balance">{{ balance }}</div>
      </div>
      <div class="profile-name">
        {{ displayAddress }}
      </div>
      <div class="profile-image">
        <img v-if="profileImageUrl" :src="profileImageUrl" />
      </div>
    </div>
    <profile
      v-if="showProfilePanel"
      :balance="balance"
      :etherBalance="etherBalance"
      @close="toggleProfile"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { BigNumber } from 'ethers'

import { formatAmount } from '@/utils/amounts'
import { getTokenLogo } from '@/utils/tokens'
import { User, getProfileImageUrl } from '@/api/user'
import { chain } from '@/api/core'
import WalletModal from '@/components/WalletModal.vue'
import { LOGOUT_USER } from '@/store/action-types'
import Profile from '@/views/Profile.vue'

@Component({ components: { Profile, WalletModal } })
export default class WalletWidget extends Vue {
  private showProfilePanel: boolean | null = null
  profileImageUrl: string | null = null
  @Prop() showEth!: boolean
  // Boolean to only show Connect button, styled like an action button,
  // which hides the widget that would otherwise display after connecting
  @Prop() isActionButton!: boolean
  // Boolean to allow connect button to be full width
  @Prop() fullWidthMobile!: boolean

  toggleProfile(): void {
    this.showProfilePanel = !this.showProfilePanel
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get walletChainId(): number | null {
    return this.$web3.chainId
  }

  get nativeTokenSymbol(): string {
    return this.$store.getters.nativeTokenSymbol
  }

  get nativeTokenDecimals(): number | undefined {
    return this.$store.getters.nativeTokenDecimals
  }

  get etherBalance(): string | null {
    const etherBalance = this.currentUser?.etherBalance
    if (etherBalance === null || typeof etherBalance === 'undefined') {
      return null
    }
    return formatAmount(etherBalance, 'ether', 4)
  }

  get balance(): string | null {
    const balance: BigNumber | null | undefined = this.currentUser?.balance
    if (balance === null || typeof balance === 'undefined') return null
    return formatAmount(balance, this.nativeTokenDecimals, 4)
  }

  async mounted() {
    this.showProfilePanel = false
    this.$web3.$on('disconnect', () => {
      this.$store.dispatch(LOGOUT_USER)
    })

    // TODO: refactor, move `chainChanged` and `accountsChanged` from here to an
    // upper level where we hear this events only once (there are other
    // components that do the same).
    this.$web3.$on('chainChanged', () => {
      if (this.currentUser) {
        // Log out user to prevent interactions with incorrect network
        this.$store.dispatch(LOGOUT_USER)
      }
    })

    let accounts: string[]
    this.$web3.$on('accountsChanged', (_accounts: string[]) => {
      if (_accounts !== accounts) {
        // Log out user if wallet account changes
        this.$store.dispatch(LOGOUT_USER)
      }
      accounts = _accounts
    })
  }

  async showModal(): Promise<void> {
    this.$modal.show(WalletModal, {}, { width: 400, top: 20 })
  }

  @Watch('$web3.user')
  async updateProfileImage(currentUser: User): Promise<void> {
    if (currentUser) {
      const url = await getProfileImageUrl(currentUser.walletAddress)
      this.profileImageUrl = url
    }
  }

  get displayAddress(): string | null {
    if (!this.currentUser) return null
    return this.currentUser.ensName ?? this.currentUser.walletAddress
  }

  get tokenLogo(): string {
    return getTokenLogo(this.nativeTokenSymbol)
  }

  get chainCurrencyLogo(): string {
    return getTokenLogo(chain.currency)
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
  margin-left: 0.5rem;
  width: fit-content;
}

.profile-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  cursor: pointer;
  background: $clr-pink-dark-gradient;
  border-radius: 32px;
  padding-right: 0.5rem;
  width: fit-content;

  .profile-name {
    font-size: 14px;
    opacity: 0.8;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: min(20vw, 14ch);
    @media (max-width: $breakpoint-s) {
      display: none;
    }
  }

  .balance {
    font-size: 14px;
    font-weight: 600;
    font-family: 'Glacial Indifference', sans-serif;
  }

  .profile-image {
    border-radius: 50%;
    box-sizing: border-box;
    height: $profile-image-size;
    /* margin-left: 20px; */
    overflow: hidden;
    width: $profile-image-size;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    img {
      height: 100%;
      width: 100%;
    }
    &:hover {
      opacity: 0.8;
      transform: scale(1.01);
      cursor: pointer;
    }
  }

  .profile-info-balance {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    cursor: pointer;
    background: $bg-primary-color;
    padding: 0.5rem 0.5rem;
    border-radius: 32px;
    margin: 0.25rem;
    margin-right: 0;
  }

  .profile-info-balance img {
    height: 16px;
    width: 16px;
  }
}

.full-width-mobile {
  @media (max-width: $breakpoint-m) {
    width: 100%;
  }
}
</style>
