<template>
  <div
    v-if="currentUser"
    :class="{
      container: showCartPanel,
      'collapsed-container': !showCartPanel,
    }"
  >
    <!-- <tooltip :position="showCartPanel ? 'right' : 'bottom'" :content="showCartPanel ? 'Close cart' : 'Cart'"> -->
      <div
        :class="{
          'toggle-btn': true,
          'shifted': showCartPanel,
        }"
        @click="toggleCart"
      >
        <img
          v-if="!showCartPanel"
          alt="open"
          width="16px"
          src="@/assets/chevron-left.svg"
        >
        <img
          alt="cart"
          width="16px"
          src="@/assets/cart.svg"
        > 
        <img
          v-if="showCartPanel"
          alt="close"
          width="16px"
          src="@/assets/chevron-right.svg"
        >
      </div>
    <!-- </tooltip> -->
    <cart v-if="showCartPanel" :toggleCart="toggleCart" class="desktop cart-component" />
    <div v-if="!showCartPanel" class="collapsed-cart desktop" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Network } from '@ethersproject/networks'
import { Web3Provider } from '@ethersproject/providers'
import Tooltip from '@/components/Tooltip.vue'
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
import Cart from '@/components/Cart.vue'
import { getNetworkName } from '@/utils/networks'

@Component({components: {Cart, Tooltip}})
export default class CartWidget extends Vue {
  private jsonRpcNetwork: Network | null = null
  private walletChainId: string | null = null
  private showCartPanel: boolean | null = null
  profileImageUrl: string | null = null

  async copyAddress(): Promise<void> {
    if (!this.currentUser) { return }
    try {
      await navigator.clipboard.writeText(this.currentUser.walletAddress as string)
      // alert('Text copied to clipboard')
    } catch (error) {
      console.warn('Error in copying text: ', error) /* eslint-disable-line no-console */
    }
  }

  toggleCart(): void {
    this.showCartPanel = !this.showCartPanel
  }

  get walletProvider(): any {
    return (window as any).ethereum
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  async mounted() {
    this.showCartPanel = false
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
    return this.jsonRpcNetwork === null ? '' : getNetworkName(this.jsonRpcNetwork)
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

  get truncatedAddress(): string {
    if (this?.currentUser?.walletAddress) {
      const address: string = this.currentUser.walletAddress
      const begin: string = address.substr(0, 6)
      const end: string = address.substr(address.length - 4, 4)
      const truncatedAddress = `${begin}…${end}`
      return truncatedAddress
    }
    return ''
  }
}
</script>


<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
  position: relative;
  height: 100%;
  box-sizing: border-box;
}

.collapsed-container {
  height: 100%;
}

.cart {
  position: relative;

}

.collapsed-cart {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 3rem;
  background: $bg-secondary-color;
  z-index: 0;
}

.toggle-btn {
  box-sizing: border-box;
  position: relative;
  top: 3rem;
  z-index: 1;
  border-radius: 0.5rem 0 0 0.5rem;
  display: flex;
  font-size: 16px;
  align-items: center;
  cursor: pointer;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  color: white;
  background: rgba(44,41,56,1); 
  border: 1px solid rgba(115,117,166,0.3);
  &:hover {
    background: $bg-secondary-color;
    gap: 0.75rem;
    margin-left: -0.25rem;
  }
}

.shifted {
  position: absolute;
  top: 3rem;
  left: 1.5rem;
  /* left: 0rem; */
  border-radius: 0 0.5rem 0.5rem 0;
  width: fit-content;
  background: rgba(44,41,56,1); 
  &:hover {
    gap: 1rem;
    padding-right: 0.25rem;
    margin-left: 0rem;
    background: $bg-secondary-color;
  }
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
  /* padding: 0.25rem 0.5rem; */
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

.cart-component {
  padding-top: 5rem;
  border-left: 1px solid $bg-light-color;
  height: 100%;
  margin-left: 2rem;
  background: $bg-secondary-color;
}
</style>
