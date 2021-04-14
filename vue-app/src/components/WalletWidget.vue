<template>
  <div class="container">
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
      class="btn connect-btn"
      @click="connect"
    >
      Connect
    </button>
    <div v-else-if="currentUser" class="profile-info">
      <div class="profile-name" @click="copyAddress">{{ truncatedAddress }}</div>
      <div class="profile-image">
        <img v-if="profileImageUrl" :src="profileImageUrl">
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Network } from '@ethersproject/networks'
import { Web3Provider } from '@ethersproject/providers'

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

@Component
export default class WalletWidget extends Vue {
  private jsonRpcNetwork: Network | null = null
  private walletChainId: string | null = null
  profileImageUrl: string | null = null

  async copyAddress(): void {
    try {
      await navigator.clipboard.writeText(this.currentUser.walletAddress)
      // alert('Text copied to clipboard')
    } catch (error) {
      console.warn('Error in copying text: ', error)
    }
  }

  get walletProvider(): any {
    return (window as any).ethereum
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  async mounted() {
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
    const user = {
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

  get truncatedAddress(): string {
    const address: string = this.currentUser.walletAddress
    const begin: string = address.substr(0, 6)
    const end: string = address.substr(address.length - 4, 4)
    const truncatedAddress = `${begin}…${end}`
    return truncatedAddress
  }
}
</script>


<style scoped lang="scss">
@import '../styles/vars';

.container {
  margin-left: $content-space;
}

.provider-error {
  text-align: center;
}

.connect-btn {
  display: block;
  margin: 0 auto;
  width: 120px;
}

.profile-info {
  display: flex;
  gap: $content-space;
  align-items: center;
  width: 100%;

  /* .profile-name {
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
  } */

  .profile-image {
    border: 4px solid $button-color;
    border-radius: 25px;
    box-sizing: border-box;
    height: $profile-image-size;
    /* margin-left: 20px; */
    overflow: hidden;
    width: $profile-image-size;

    img {
      height: 100%;
      width: 100%;
    }
  }
}
</style>
