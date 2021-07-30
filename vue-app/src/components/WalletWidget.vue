<template>
  <div :class="{ container: !isActionButton }">
    <template v-if="!isLoaded()"></template>
    <div v-if="walletProvider && !isCorrectNetwork()" class="provider-error">
      Please change network to {{ networkName }}
    </div>
    <button
      v-else-if="!currentUser"
      :class="isActionButton ? 'btn-action' : 'app-btn'"
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
        <img v-if="!showEth" src="@/assets/dai.svg" />
        <img v-if="showEth" src="@/assets/eth.svg" />
        <div v-if="!showEth" class="balance">
          {{ balance }}
        </div>
        <div v-if="showEth" class="balance">{{ etherBalance }}</div>
      </div>
      <div class="profile-name">
        {{ renderUserAddress(7) }}
      </div>
      <div class="profile-image">
        <img v-if="profileImageUrl" :src="profileImageUrl" />
      </div>
    </div>
    <profile
      v-if="showProfilePanel"
      :toggleProfile="toggleProfile"
      :balance="balance"
      :etherBalance="etherBalance"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { Network } from '@ethersproject/networks'
import { commify, formatUnits } from '@ethersproject/units'

import { provider as jsonRpcProvider } from '@/api/core'
import { User } from '@/api/user'
import WalletModal from '@/components/WalletModal.vue'
import { LOGOUT_USER } from '@/store/action-types'
import Profile from '@/views/Profile.vue'

@Component({ components: { Profile, WalletModal } })
export default class WalletWidget extends Vue {
  private jsonRpcNetwork: Network | null = null
  private showProfilePanel: boolean | null = null
  profileImageUrl: string | null = null
  @Prop() showEth!: boolean

  // Boolean to only show Connect button, styled like an action button,
  // which hides the widget that would otherwise display after connecting
  @Prop() isActionButton!: boolean

  toggleProfile(): void {
    this.showProfilePanel = !this.showProfilePanel
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get walletProvider(): any {
    return this.$web3.provider
  }

  get walletChainId(): number | null {
    return this.$web3.chainId
  }

  get etherBalance(): string | null {
    const etherBalance = this.currentUser?.etherBalance
    if (etherBalance === null || typeof etherBalance === 'undefined') {
      return null
    }
    return commify(formatUnits(etherBalance, 'ether'))
  }

  get balance(): string | null {
    const balance = this.currentUser?.balance
    if (balance === null || typeof balance === 'undefined') {
      return null
    }
    return commify(formatUnits(balance, 18))
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

    this.jsonRpcNetwork = await jsonRpcProvider.getNetwork()
  }

  isLoaded(): boolean {
    return this.jsonRpcNetwork !== null && this.walletChainId !== null
  }

  isCorrectNetwork(): boolean {
    if (this.jsonRpcNetwork === null || this.walletChainId === null) {
      // Still loading
      return false
    }
    return this.jsonRpcNetwork.chainId === this.walletChainId
  }

  get networkName(): string {
    if (this.jsonRpcNetwork === null) {
      return ''
    } else if (
      this.jsonRpcNetwork.name === 'unknown' &&
      this.jsonRpcNetwork.chainId === 100
    ) {
      return 'xdai'
    } else {
      return this.jsonRpcNetwork.name
    }
  }

  async showModal(): Promise<void> {
    this.$modal.show(
      WalletModal,
      { updateProfileImage: this.updateProfileImage },
      { width: 400, top: 20 }
    )
  }

  updateProfileImage(url: string): void {
    this.profileImageUrl = url
  }

  // TODO: Extract into a shared function
  renderUserAddress(digitsToShow?: number): string {
    if (this.currentUser?.walletAddress) {
      const address: string = this.currentUser.walletAddress
      if (digitsToShow) {
        const beginDigits: number = Math.ceil(digitsToShow / 2)
        const endDigits: number = Math.floor(digitsToShow / 2)
        const begin: string = address.substr(0, 2 + beginDigits)
        const end: string = address.substr(
          address.length - endDigits,
          endDigits
        )
        return `${begin}…${end}`
      }
      return address
    }
    return ''
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

.provider-error {
  text-align: center;
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

.full-width {
  width: 100%;
}
</style>
