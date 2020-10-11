<template>
  <div class="profile">
    <div v-if="!provider" class="provider-error">Wallet not found</div>
    <button
      v-if="provider && !currentUser"
      class="btn connect-btn"
      @click="connect"
    >
      Connect
    </button>
    <div v-if="currentUser" class="profile-info">
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
import { Web3Provider } from '@ethersproject/providers'

import { User, getProfileImageUrl } from '@/api/user'
import { CHECK_VERIFICATION } from '@/store/action-types'
import { SET_CURRENT_USER } from '@/store/mutation-types'
import { sha256 } from '@/utils/crypto'

const LOGIN_MESSAGE = 'Sign this message to access clr.fund'

@Component
export default class Profile extends Vue {

  provider: Web3Provider | null = null
  profileImageUrl: string | null = null

  mounted() {
    const provider = (window as any).ethereum
    if (!provider) {
      return
    }
    let chainId: string
    let accounts: string[]
    provider.on('chainChanged', (_chainId: string) => {
      if (chainId && _chainId !== chainId) {
        window.location.reload()
      }
      chainId = _chainId
    })
    provider.on('accountsChanged', (_accounts: string[]) => {
      if (accounts && _accounts !== accounts) {
        window.location.reload()
      }
      accounts = _accounts
    })
    this.provider = new Web3Provider(provider)
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
