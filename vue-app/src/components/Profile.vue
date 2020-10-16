<template>
  <div class="profile">
    <div v-if="!provider" class="provider-error">Wallet not found</div>
    <div
      v-else-if="provider && !isCorrectNetwork()"
      class="provider-error"
    >
      Please change network to {{ jsonRpcNetwork.name }}
    </div>
    <button
      v-else-if="provider && !currentUser"
      class="btn connect-btn"
      @click="connect"
    >
      Connect
    </button>
    <div v-else-if="currentUser" class="profile-info">
      <div class="profile-name">{{ currentUser.walletAddress }}</div>
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
import { User, getProfileImageUrl } from '@/api/user'
import { CHECK_VERIFICATION } from '@/store/action-types'
import { SET_CURRENT_USER } from '@/store/mutation-types'
import { sha256 } from '@/utils/crypto'

const LOGIN_MESSAGE = 'Sign this message to access clr.fund'

@Component
export default class Profile extends Vue {

  jsonRpcNetwork: Network | null = null
  private walletChainId = '0xNaN'
  provider: Web3Provider | null = null
  profileImageUrl: string | null = null

  mounted() {
    const provider = (window as any).ethereum
    if (!provider) {
      return
    }
    this.walletChainId = provider.chainId
    provider.on('chainChanged', (_chainId: string) => {
      if (_chainId !== this.walletChainId) {
        this.walletChainId = _chainId
        if (this.currentUser) {
          // Log out user to prevent interactions with incorrect network
          this.$store.commit(SET_CURRENT_USER, null)
        }
      }
    })
    let accounts: string[]
    provider.on('accountsChanged', (_accounts: string[]) => {
      if (_accounts !== accounts) {
        // Log out user if wallet account changes
        this.$store.commit(SET_CURRENT_USER, null)
      }
      accounts = _accounts
    })
    this.provider = new Web3Provider(provider)
    this.getJsonRpcNetwork()
  }

  async getJsonRpcNetwork() {
    this.jsonRpcNetwork = await jsonRpcProvider.getNetwork()
  }

  isCorrectNetwork(): boolean {
    if (this.jsonRpcNetwork === null || this.walletChainId === '0xNaN') {
      // Skip check if loading or if on devnet
      return true
    }
    return this.jsonRpcNetwork.chainId === parseInt(this.walletChainId, 16)
  }

  async connect(): Promise<void> {
    const provider = this.provider ? this.provider.provider : null
    if (!provider || !provider.request) {
      return
    }
    let walletAddress
    try {
      [walletAddress] = await provider.request({ method: 'eth_requestAccounts' })
    } catch (error) {
      // Access denied
      return
    }
    let signature
    try {
      signature = await provider.request({
        method: 'personal_sign',
        params: [LOGIN_MESSAGE, walletAddress],
      })
    } catch (error) {
      // Signature request rejected
      return
    }
    const user = {
      walletProvider: this.provider,
      walletAddress,
      isVerified: null,
      encryptionKey: sha256(signature),
    }
    this.$store.commit(SET_CURRENT_USER, user)
    this.$store.dispatch(CHECK_VERIFICATION)
    this.profileImageUrl = await getProfileImageUrl(user.walletAddress)
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }
}
</script>


<style scoped lang="scss">
@import '../styles/vars';

.profile {
  background-color: #23212f;
  padding: $content-space;
}

.connect-btn {
  display: block;
  margin: 0 auto;
  width: 120px;
}

.profile-info {
  align-items: center;
  display: flex;
  flex-direction: row;

  .profile-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .profile-image {
    border: 4px solid $button-color;
    border-radius: 25px;
    box-sizing: border-box;
    height: 50px;
    margin-left: 20px;
    overflow: hidden;
    width: 50px;

    img {
      height: 100%;
      width: 100%;
    }
  }
}
</style>
