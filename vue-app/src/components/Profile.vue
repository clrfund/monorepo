<template>
  <div class="profile">
    <div v-if="!walletProvider" class="provider-error">Wallet not found</div>
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
import { LOAD_USER_INFO } from '@/store/action-types'
import { SET_CURRENT_USER } from '@/store/mutation-types'
import { sha256 } from '@/utils/crypto'

const LOGIN_MESSAGE = 'Sign this message to access clr.fund'

@Component
export default class Profile extends Vue {

  private jsonRpcNetwork: Network | null = null
  private walletChainId = '0xNaN'
  profileImageUrl: string | null = null

  get walletProvider(): any {
    return (window as any).ethereum
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  mounted() {
    if (!this.walletProvider) {
      return
    }
    this.walletChainId = this.walletProvider.chainId
    this.walletProvider.on('chainChanged', (_chainId: string) => {
      if (_chainId !== this.walletChainId) {
        this.walletChainId = _chainId
        if (this.currentUser) {
          // Log out user to prevent interactions with incorrect network
          this.$store.commit(SET_CURRENT_USER, null)
        }
      }
    })
    let accounts: string[]
    this.walletProvider.on('accountsChanged', (_accounts: string[]) => {
      if (_accounts !== accounts) {
        // Log out user if wallet account changes
        this.$store.commit(SET_CURRENT_USER, null)
      }
      accounts = _accounts
    })
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
    this.$store.commit(SET_CURRENT_USER, user)
    this.$store.dispatch(LOAD_USER_INFO)
    this.profileImageUrl = await getProfileImageUrl(user.walletAddress)
  }
}
</script>


<style scoped lang="scss">
@import '../styles/vars';

.profile {
  background-color: #23212f;
  padding: $content-space;
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
