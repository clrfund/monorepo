<template>
  <div>
    <div v-if="connectingWallet" class="modal-body loading">
      <loader />
      <p>Connecting wallet</p>
    </div>
    <div v-else class="modal-body">
      <div class="top">
        <p>Connect to a wallet</p>
        <img class="pointer" src="@/assets/close.svg" @click="$emit('close')" />
      </div>
      <div v-if="windowEthereum" class="option" @click="connectMetaMask()">
        <p>MetaMask</p>
        <img height="24px" width="24px" src="@/assets/metamask.png" />
      </div>
      <div v-else class="option" @click="redirectToMetamaskWebsite()">
        <p>Install MetaMask</p>
        <img height="24px" width="24px" src="@/assets/metamask.png" />
      </div>
      <div class="option" @click="connectWalletConnect()">
        <p>WalletConnect</p>
        <img height="24px" width="24px" src="@/assets/walletConnectIcon.svg" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Libraries
import { Web3Provider } from '@ethersproject/providers'
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

// API
import { providers } from '@/api/core'
import { LOGIN_MESSAGE, User, getProfileImageUrl } from '@/api/user'

// Components
import Loader from '@/components/Loader.vue'

// Store
import {
  LOAD_USER_INFO,
  LOAD_CART,
  LOAD_COMMITTED_CART,
  LOAD_CONTRIBUTOR_DATA,
  LOGIN_USER,
} from '@/store/action-types'
import { SET_CURRENT_USER } from '@/store/mutation-types'

// Utils
import { sha256 } from '@/utils/crypto'

@Component({
  components: {
    Loader,
  },
})
export default class WalletModal extends Vue {
  @Prop() updateProfileImage!: (profileImageUrl: string | null) => void

  connectingWallet = false

  get windowEthereum(): any {
    return (window as any).ethereum
  }

  async connectMetaMask() {
    if (!this.windowEthereum || !this.windowEthereum.request) {
      return
    }

    this.connectingWallet = true
    let walletAddress
    try {
      ;[walletAddress] = await this.windowEthereum.request({
        method: 'eth_requestAccounts',
      })
    } catch (error) {
      // Access denied
      return
    }
    let signature
    try {
      signature = await this.windowEthereum.request({
        method: 'personal_sign',
        params: [LOGIN_MESSAGE, walletAddress],
      })
    } catch (error) {
      // Signature request rejected
      this.connectingWallet = false
      return
    }
    const user: User = {
      walletProvider: new Web3Provider(this.windowEthereum),
      walletAddress,
      encryptionKey: sha256(signature),
      isVerified: null,
      balance: null,
      contribution: null,
    }

    this.$emit('connected')
    this.connectingWallet = false

    getProfileImageUrl(user.walletAddress).then((url) => {
      this.updateProfileImage(url)
    })
    this.$store.commit(SET_CURRENT_USER, user)
    await this.$store.dispatch(LOGIN_USER)
    if (this.$store.state.currentRound) {
      // Load cart & contributor data for current round
      this.$store.dispatch(LOAD_USER_INFO)
      this.$store.dispatch(LOAD_CART)
      this.$store.dispatch(LOAD_COMMITTED_CART)
      this.$store.dispatch(LOAD_CONTRIBUTOR_DATA)
    }
    this.$emit('close')
  }

  async connectWalletConnect() {
    this.connectingWallet = true
    await providers.walletconnectProvider.enable()

    let signature
    try {
      signature = await providers.walletconnectProvider.request({
        method: 'personal_sign',
        params: [LOGIN_MESSAGE, providers.walletconnectProvider.accounts[0]],
      })
    } catch (error) {
      // Signature request rejected
      this.connectingWallet = false
      return
    }

    const user: User = {
      walletProvider: new Web3Provider(providers.walletconnectProvider),
      walletAddress: providers.walletconnectProvider.accounts[0],
      encryptionKey: sha256(signature),
      isVerified: null,
      balance: null,
      contribution: null,
    }

    this.$emit('connected')
    this.connectingWallet = false

    getProfileImageUrl(user.walletAddress).then((url) => {
      this.updateProfileImage(url)
    })
    this.$store.commit(SET_CURRENT_USER, user)
    await this.$store.dispatch(LOGIN_USER)
    if (this.$store.state.currentRound) {
      // Load cart & contributor data for current round
      this.$store.dispatch(LOAD_USER_INFO)
      this.$store.dispatch(LOAD_CART)
      this.$store.dispatch(LOAD_COMMITTED_CART)
      this.$store.dispatch(LOAD_CONTRIBUTOR_DATA)
    }
    this.$emit('close')
  }

  redirectToMetamaskWebsite() {
    window.open('https://metamask.io/', '_blank')
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.vm--modal {
  background-color: transparent !important;
  box-shadow: none;
}

.modal-body {
  margin-top: $modal-space;
  text-align: left;
  background: $bg-secondary-color;
  border-radius: 1rem;
  display: grid;
  grid-gap: 10px;
}

.loading {
  align-content: center;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -16px;
}

.option {
  background: $bg-light-color;
  padding: 0 1rem;
  border-radius: 1rem;
  border: 1px solid;
  border-color: #ffffff66;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:hover {
    cursor: pointer;
    border-color: $clr-green;
  }

  .btn-margin {
    margin-top: 16px;
  }
}
</style>
