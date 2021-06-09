<template>
  <div
    v-if="currentUser"
    :class="{
      container: $store.state.showCartPanel,
      'collapsed-container': !$store.state.showCartPanel,
    }"
  >
    <div
      v-if="!$store.state.showCartPanel"
      class="toggle-btn desktop"
      @click="toggleCart"
    >
      <img
        alt="open"
        width="16px"
        src="@/assets/chevron-left.svg"
      >
      <div 
        :class="[cart.length +- 0 ? 'circle pulse cart-indicator' : 'cart-indicator']"
        v-if="!$store.state.showCartPanel && isCartBadgeShown" 
      >
      {{ cart.length }}
      </div>
      <img
        alt="cart"
        width="16px"
        src="@/assets/cart.svg"
      > 
    </div>
    <cart v-if="$store.state.showCartPanel" class="cart-component" />
    <div v-if="!$store.state.showCartPanel" class="collapsed-cart desktop" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Network } from '@ethersproject/networks'
import { Web3Provider } from '@ethersproject/providers'
import Tooltip from '@/components/Tooltip.vue'
import { provider as jsonRpcProvider } from '@/api/core'
import { RoundStatus } from '@/api/round'
import { LOGIN_MESSAGE, User, getProfileImageUrl } from '@/api/user'
import { CartItem } from '@/api/contributions'
import {
  LOAD_USER_INFO,
  LOAD_CART,
  LOAD_COMMITTED_CART_DISPATCH,
  LOAD_CONTRIBUTOR_DATA,
  LOGIN_USER,
  LOGOUT_USER,
} from '@/store/action-types'
import {
  SET_CURRENT_USER,
  TOGGLE_SHOW_CART_PANEL,
} from '@/store/mutation-types'
import { sha256 } from '@/utils/crypto'
import Cart from '@/components/Cart.vue'
import { getNetworkName } from '@/utils/networks'

@Component({components: {Cart, Tooltip}})
export default class CartWidget extends Vue {
  private jsonRpcNetwork: Network | null = null
  private walletChainId: string | null = null
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
    this.$store.commit(TOGGLE_SHOW_CART_PANEL)
  }

  private get cart(): CartItem[] {
    return this.$store.state.cart
  }

  get isCartEmpty(): boolean {
    return this.cart.length === 0
  }

  get filteredCart(): CartItem[] {
    // In tallying round use committedCart for cart items
    if (this.$store.state.currentRound.status === RoundStatus.Tallying) {
      return this.$store.state.committedCart
    }

    return this.cart.filter((item) => !item.isCleared)
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
      this.$store.dispatch(LOAD_COMMITTED_CART_DISPATCH)
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

  get isCartBadgeShown(): boolean {
    /**
     * Only show cart badge counter if there are new/changed items present
     * and the user is still able to contribute/reallocate these changes.
     */
    return (
      (this.$store.getters.canUserReallocate ||
      this.$store.getters.isRoundContributionPhase) &&
      !!this.$store.state.cart.length
    )
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

.cart-indicator {
  border-radius: 2rem;
  background: $clr-pink-light-gradient;
  padding: 0.25rem;
  font-size: 10px;
  color: #fff;
  line-height: 100%;
  width: 8px;
  height: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.open{
  background: $clr-green;
}

.circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.pulse {
  animation: pulse-animation 2s 1 ease-out;
}

@keyframes pulse-animation {
  0% {
    box-shadow: 0 0 0 0px $bg-primary-color;
  }

  100% {
    box-shadow: 0 0 0 4px $clr-pink;

  }
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
  width: $cart-width-closed;
  background: $bg-secondary-color;
  z-index: 0;
}

.toggle-btn {
  box-sizing: border-box;
  position: absolute;
  top: 1.875rem;
  right: 0;
  width: fit-content;
  z-index: 1;
  border-radius: 0.5rem 0 0 0.5rem;
  display: flex;
  justify-content: flex-end;
  font-size: 16px;
  align-items: center;
  cursor: pointer;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  color: white;
  background: rgba(44,41,56,1); 
  border: 1px solid rgba(115,117,166,0.3);
  border-right: none;
  &:hover {
    background: $bg-secondary-color;
    gap: 0.75rem;
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


  .cart-component {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}

</style>
