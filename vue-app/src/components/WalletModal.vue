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
      <div
        v-if="windowEthereum"
        class="option"
        @click="connectWallet('metamask')"
      >
        <p>MetaMask</p>
        <img height="24px" width="24px" src="@/assets/metamask.png" />
      </div>
      <div v-else class="option" @click="redirectToMetamaskWebsite()">
        <p>Install MetaMask</p>
        <img height="24px" width="24px" src="@/assets/metamask.png" />
      </div>
      <div class="option" @click="connectWallet('walletconnect')">
        <p>WalletConnect</p>
        <img height="24px" width="24px" src="@/assets/walletConnectIcon.svg" />
      </div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script lang="ts">
// Libraries
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

// Components
import Loader from '@/components/Loader.vue'

@Component({
  components: {
    Loader,
  },
})
export default class WalletModal extends Vue {
  @Prop() updateProfileImage!: (profileImageUrl: string | null) => void

  connectingWallet = false
  error = ''

  get windowEthereum(): any {
    return (window as any).ethereum
  }

  async connectWallet(walletType: string) {
    this.error = ''
    this.connectingWallet = true
    try {
      await this.$web3.connectWallet(walletType)
      this.$emit('close')
    } catch (error) {
      this.error = error.message
    }
    this.connectingWallet = false
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
  text-align: center;
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
