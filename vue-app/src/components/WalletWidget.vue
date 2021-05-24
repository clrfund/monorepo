<template>
  <div>
    <div v-if="!walletProvider" class="provider-error">Wallet not found</div>
    <template v-else-if="!isLoaded()"></template>
    <div
      v-else-if="walletProvider && !isCorrectNetwork()"
      class="provider-error"
    >
      Please change network to {{ networkName }}
    </div>
    <button
      v-else-if="walletProvider && !currentUser"
      :class="isActionButton ? 'btn-action' : 'app-btn'"
      @click="connect"
    >
      Connect
    </button>
    <div v-else-if="currentUser" class="profile-info" @click="toggleProfile()">
      <div class="profile-info-balance">
        <img src="@/assets/dai.svg" />
        <div class="balance" @click="copyAddress">{{ balance }}</div>
      </div>
      <div class="profile-name" @click="copyAddress">{{ renderUserAddress(7) }}</div>
      <div class="profile-image">
        <img v-if="profileImageUrl" :src="profileImageUrl">
      </div>
    </div>
    <profile v-if="showProfilePanel" :toggleProfile="toggleProfile" :balance="balance" :etherBalance="etherBalance" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { Network } from '@ethersproject/networks'
import { Web3Provider } from '@ethersproject/providers'
import { commify, formatUnits } from '@ethersproject/units'

import { provider as jsonRpcProvider } from '@/api/core'
import { LOGIN_MESSAGE, User, getProfileImageUrl } from '@/api/user'
import {
  LOAD_USER_INFO,
  LOAD_CART,
  LOAD_CONTRIBUTOR_DATA,
  LOGIN_USER,
  LOGOUT_USER,
} from '@/store/action-types'
import {
  SET_CURRENT_USER,
} from '@/store/mutation-types'
import { sha256 } from '@/utils/crypto'
import Profile from '@/views/Profile.vue'

@Component({components: {Profile}})
export default class WalletWidget extends Vue {
  private jsonRpcNetwork: Network | null = null
  private walletChainId: string | null = null
  private showProfilePanel: boolean | null = null
  profileImageUrl: string | null = null
  @Prop() isActionButton!: boolean

  async copyAddress(): Promise<void> {
    if (!this.currentUser) { return }
    try {
      await navigator.clipboard.writeText(this.currentUser.walletAddress)
      // alert('Text copied to clipboard')
    } catch (error) {
      console.warn('Error in copying text: ', error) /* eslint-disable-line no-console */
    }
  }

  toggleProfile(): void {
    this.showProfilePanel = !this.showProfilePanel
  }

  get walletProvider(): any {
    return (window as any).ethereum
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get etherBalance(): string | null {
    const etherBalance = this.currentUser?.etherBalance
    if (etherBalance === null || typeof etherBalance === 'undefined') { return null }
    return commify(formatUnits(etherBalance, 'ether'))
  }

  get balance(): string | null {
    const balance = this.currentUser?.balance
    if (balance === null || typeof balance === 'undefined') { return null }
    return commify(formatUnits(balance, 18))
  }

  async mounted() {
    this.showProfilePanel = false
    if (!this.walletProvider) {
      return
    }
    this.walletChainId = await this.walletProvider.request({ method: 'eth_chainId' })
    this.walletProvider.on('chainChanged', (_chainId: string) => {
      if (_chainId !== this.walletChainId) {
        this.walletChainId = _chainId
        if (this.currentUser) {
          // Log out user to prevent interactions with incorrect network
          this.$store.dispatch(LOGOUT_USER)
        }
      }
    })
    let accounts: string[]
    this.walletProvider.on('accountsChanged', (_accounts: string[]) => {
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
    if (this.walletChainId === '0xNaN') {
      // Devnet
      return true
    }
    return this.jsonRpcNetwork.chainId === parseInt(this.walletChainId, 16)
  }

  get networkName(): string {
    if (this.jsonRpcNetwork === null) {
      return ''
    } else if (this.jsonRpcNetwork.name === 'unknown' && this.jsonRpcNetwork.chainId === 100) {
      return 'xdai'
    } else {
      return this.jsonRpcNetwork.name
    }
  }

  async connect(): Promise<void> {
    if (!this.walletProvider || !this.walletProvider.request) {
      return
    }
    let walletAddress
    try {
      [walletAddress] = await this.walletProvider.request({ method: 'eth_requestAccounts' })
    } catch (error) {
      // Access denied
      return
    }
    let signature
    try {
      signature = await this.walletProvider.request({
        method: 'personal_sign',
        params: [LOGIN_MESSAGE, walletAddress],
      })
    } catch (error) {
      // Signature request rejected
      return
    }
    const user: User = {
      walletProvider: new Web3Provider(this.walletProvider),
      walletAddress,
      encryptionKey: sha256(signature),
      isVerified: null,
      balance: null,
      contribution: null,
    }

    getProfileImageUrl(user.walletAddress)
      .then((url) => this.profileImageUrl = url)
    this.$store.commit(SET_CURRENT_USER, user)
    await this.$store.dispatch(LOGIN_USER)
    if (this.$store.state.currentRound) {
      // Load cart & contributor data for current round
      this.$store.dispatch(LOAD_USER_INFO)
      this.$store.dispatch(LOAD_CART)
      this.$store.dispatch(LOAD_CONTRIBUTOR_DATA)
    }
  }

  // TODO: Extract into a shared function
  renderUserAddress(digitsToShow?: number): string {
    if (this.currentUser?.walletAddress) {
      const address: string = this.currentUser.walletAddress
      if (digitsToShow) {
        const beginDigits: number = Math.ceil(digitsToShow / 2)
        const endDigits: number = Math.floor(digitsToShow / 2)
        const begin: string = address.substr(0, 2 + beginDigits)
        const end: string = address.substr(address.length - endDigits, endDigits)
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

  .profile-name {
    font-size: 14px;
    opacity: 0.8;
  } 

  .balance {
    font-size: 14px;
    font-weight: 600;
    font-family: "Glacial Indifference", sans-serif;
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
</style>
