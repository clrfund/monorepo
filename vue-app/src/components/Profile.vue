<template>
  <div class="profile">
    <div v-if="!provider" class="provider-error">Wallet not found</div>
    <button
      v-if="provider && !account"
      class="btn connect-btn"
      @click="connect"
    >
      Connect
    </button>
    <div v-if="account" class="profile-info">
      <div class="profile-name">{{ account }}</div>
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

import { getProfileImageUrl } from '@/api/profile'
import { SET_WALLET_PROVIDER, SET_ACCOUNT } from '@/store/mutation-types'

@Component
export default class Profile extends Vue {

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
    this.$store.commit(SET_WALLET_PROVIDER, new Web3Provider(provider))
  }

  get provider(): Web3Provider | null {
    return this.$store.state.walletProvider
  }

  async connect(): Promise<void> {
    const provider = this.provider ? this.provider.provider : null
    if (!provider || !provider.request) {
      return
    }
    let accounts
    try {
      accounts = await provider.request({ method: 'eth_requestAccounts' })
    } catch (error) {
      return
    }
    const walletAddress = accounts[0]
    this.$store.commit(SET_ACCOUNT, walletAddress)
    this.profileImageUrl = await getProfileImageUrl(walletAddress)
  }

  get account(): string {
    return this.$store.state.account
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
