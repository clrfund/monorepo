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
      <div class="profile-image"></div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { SET_ACCOUNT } from '@/store/mutation-types'

@Component
export default class Profile extends Vue {

  provider: any = null // eslint-disable-line @typescript-eslint/no-explicit-any

  mounted() {
    this.provider = (window as any).ethereum // eslint-disable-line @typescript-eslint/no-explicit-any
    let chainId: string
    let accounts: string[]
    this.provider.on('chainChanged', (_chainId: string) => {
      if (chainId && _chainId !== chainId) {
        window.location.reload()
      }
      chainId = _chainId
    })
    this.provider.on('accountsChanged', (_accounts: string[]) => {
      if (accounts && _accounts !== accounts) {
        window.location.reload()
      }
      accounts = _accounts
    })
  }

  async connect(): Promise<void> {
    if (!this.provider) {
      return
    }
    let accounts
    try {
      accounts = await this.provider.request({ method: 'eth_requestAccounts' })
    } catch (error) {
      return
    }
    this.$store.commit(SET_ACCOUNT, accounts[0])
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
    background-color: black;
    border: 4px solid $button-color;
    border-radius: 25px;
    box-sizing: border-box;
    height: 50px;
    margin-left: 20px;
    width: 50px;
  }
}
</style>
