<template>
<div style="height: 100%;">
  <div v-if="!currentUser" class="empty-cart">
    <div class="moon-emoji">🌚</div>
    <h3>Connect to see your cart </h3>
    <wallet-widget :isActionButton="true" />
  </div>
  <div v-else class="cart-container">
    <div class="flex cart-title-bar">
      <div v-if="showCollapseCart" @click="toggleCart" class="absolute-left cart-btn">
        <img
          alt="cart"
          width="16px"
          src="@/assets/cart.svg"
        >
        <img
          alt="close"
          width="16px"
          src="@/assets/chevron-right.svg"
        >
      </div>
      <h2>Your cart</h2>
      <div v-if="($store.getters.isRoundContributionPhase || $store.getters.canUserReallocate) && !isCartEmpty" class="absolute-right dropdown">
        <img @click="openDropdown" class="dropdown-btn" src="@/assets/more.svg" />
        <div id="cart-dropdown" class="button-menu">
          <div v-for="({ callback, text, icon }, idx) of dropdownItems" :key="idx" class="dropdown-item" @click="callback">
            <img width="16px" :src="require(`@/assets/${icon}`)" />
            <p>{{ text }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="messages-and-cart-items">
      <div class="reallocation-intro" v-if="$store.getters.canUserReallocate">
        You’ve already contributed this round. You can edit your choices and add new projects, but your cart total must always equal your original contribution amount. <router-link to="/about-maci">Why?</router-link>
      </div>
      <div class="reallocation-intro" v-if="$store.getters.hasUserContributed && $store.getters.hasReallocationPhaseEnded">
        This round is over. Here’s how you contributed. Thanks!
      </div>
      <div class="cart">
        <div v-if="!$store.getters.hasUserContributed && $store.getters.hasContributionPhaseEnded" class="empty-cart">
          <div class="moon-emoji">🌚</div>
          <h3>Too late to donate</h3>
          <div>Sorry, the deadline for donating has passed.</div>
        </div>
        <div v-else-if="isCartEmpty && $store.getters.isRoundContributionPhase" class="empty-cart">
          <div class="moon-emoji">🌚</div>
          <h3>Your cart is empty</h3>
          <div>Choose some projects that you want to contribute to...</div>
          <router-link to="/projects" class="btn-secondary mobile mt1">See projects</router-link>
        </div>
        <div v-else-if="$store.getters.canUserReallocate && !isCartEmpty">
          <div class="flex-row-reallocation">
            <div @click="handleEditState" v-if="$store.getters.canUserReallocate">
              <span v-if="editModeSelection">Cancel</span>
              <span v-else>Edit</span>
            </div>
            <div @click="removeAll" v-if="$store.getters.canUserReallocate">Remove all</div>
          </div>
        </div>
        <div v-else-if="$store.getters.hasUserContributed" class="flex-row-reallocation" id="readOnly">
          <!-- Round is finalized -->
          <div>Your contributions</div>
        </div>
        <cart-items
          v-if="$store.getters.hasUserContributed || !$store.getters.hasContributionPhaseEnded"
          :cartList="filteredCart"
          :isEditMode="isEditMode"
          :isAmountValid="isAmountValid"
        />
      </div>
    </div>
    <div class="submit-btn-wrapper"
      v-if="$store.getters.canUserReallocate || $store.getters.isRoundContributionPhase"
    >
      <!--  TODO: Also, add getter for pre-contribution phase -->
      <!-- REMOVING FOR NOW WHILE WE DON'T HAVE A JOIN PHASE: <div v-if="$store.getters.isRoundJoinPhase || $store.getters.isRoundJoinOnlyPhase || $store.getters.isRoundBufferPhase">
        Round opens for contributing in {{startDateCountdown}}. <span v-if="canRegisterWithBrightId">Get verified with BrightID while you wait.</span>
      </div> --> 
      <div v-if="errorMessage" class="submit-error">
        {{ errorMessage }}
      </div>
      <div class="p1" v-if="hasUnallocatedFunds()">
        Unallocated funds ({{ formatAmount(this.contribution) - formatAmount(getTotal())}} {{ tokenSymbol }}) will be sent to the matching pool.
        Your cart must add up to your original {{ formatAmount(this.contribution) }} {{tokenSymbol}} donation.
      </div>
      <!-- <div v-if="canRegisterWithBrightId" @click="registerWithBrightId()" class="btn-primary"> -->
      <div class="p1" v-if="canRegisterWithBrightId">
        <router-link to="/setup" class="btn-primary"> 
          Verify with BrightID
        </router-link>
      </div>
      <button
        v-if="canWithdrawContribution()"
        class="btn-action"
        @click="withdrawContribution()"
      >
        Withdraw {{ formatAmount(contribution) }} {{ tokenSymbol }}
      </button>
      <button
        v-if="!errorMessage && !isCartEmpty"
        class="btn-action"
        :disabled="errorMessage !== null || isCartEmpty"
        @click="submitCart"
      >
        <template v-if="contribution.isZero()">
          Contribute {{ formatAmount(getTotal()) }} {{ tokenSymbol }} to {{ cart.length }} projects
        </template>
        <template v-else-if="hasUnallocatedFunds()">
          Reallocate {{ formatAmount(getTotal()) }} of {{ formatAmount(contribution) }} {{ tokenSymbol }}
        </template>
        <template v-else>
          Reallocate {{ formatAmount(getTotal()) }} {{ tokenSymbol }}
        </template>
      </button>
      <div v-if="$store.getters.isRoundContributionPhase || $store.getters.canUserReallocate" class="time-left">
          <div class="flex"><img src="@/assets/time.svg" /> Time left</div>
          <div v-if="$store.getters.canUserReallocate" class="flex">
            <div v-if="reallocationTimeLeft.days > 0">{{ reallocationTimeLeft.days }}</div>
            <div v-if="reallocationTimeLeft.days > 0">days</div>
            <div>{{ reallocationTimeLeft.hours }}</div>
            <div>hours</div>
            <div v-if="reallocationTimeLeft.days === 0">{{ reallocationTimeLeft.minutes }}</div>
            <div v-if="reallocationTimeLeft.days === 0">minutes</div>
          </div>
          <div v-else class="flex">
            <div v-if="contributionTimeLeft.days > 0">{{ contributionTimeLeft.days }}</div>
            <div v-if="contributionTimeLeft.days > 0">days</div>
            <div>{{ contributionTimeLeft.hours }}</div>
            <div>hours</div>
            <div v-if="contributionTimeLeft.days === 0">{{ contributionTimeLeft.minutes }}</div>
            <div v-if="contributionTimeLeft.days === 0">minutes</div>
          </div>
        </div>
    </div>
    <div id="cart-bottom-scroll-point"></div>
    <!-- TODO under what conditions to display? -->
    <div class="total-bar" v-if="$store.getters.isRoundContributionPhase || ($store.getters.hasUserContributed && ($store.getters.isRoundTallying || $store.getters.isRoundFinalized || $store.getters.hasContributionPhaseEnded))">
      <div><span class="total-label">Total</span> {{ formatAmount(getTotal()) }} {{ tokenSymbol }}</div>
      <div class="btn-secondary" @click="scrollToBottom"><img src="@/assets/chevron-down.svg" /></div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber, FixedNumber } from 'ethers'
import { Network } from '@ethersproject/networks'
import { parseFixed } from '@ethersproject/bignumber'
import { commify, formatUnits } from '@ethersproject/units'
import { DateTime } from 'luxon'
import WalletWidget from '@/components/WalletWidget.vue'
import BrightIdModal from '@/components/BrightIdModal.vue'
import Tooltip from '@/components/Tooltip.vue'
import ContributionModal from '@/components/ContributionModal.vue'
import ReallocationModal from '@/components/ReallocationModal.vue'
import WithdrawalModal from '@/components/WithdrawalModal.vue'
import CartItems from '@/components/CartItems.vue'
import { Web3Provider } from '@ethersproject/providers'
import {
  SET_CURRENT_USER,
} from '@/store/mutation-types'
import { sha256 } from '@/utils/crypto'
import {
  MAX_CONTRIBUTION_AMOUNT,
  MAX_CART_SIZE,
  CartItem,
} from '@/api/contributions'
import { userRegistryType, provider as jsonRpcProvider } from '@/api/core'
import { RoundStatus, TimeLeft } from '@/api/round'
import {
  LOAD_USER_INFO,
  LOAD_CART,
  LOAD_CONTRIBUTOR_DATA,
  LOGIN_USER,
  LOGOUT_USER,
  SAVE_CART,
} from '@/store/action-types'
import { LOGIN_MESSAGE, User, getProfileImageUrl } from '@/api/user'
import { CLEAR_CART, TOGGLE_SHOW_CART_PANEL } from '@/store/mutation-types'
import { formatAmount } from '@/utils/amounts'
import { getNetworkName } from '@/utils/networks'
import { formatDateFromNow } from '@/utils/dates'

function timeLeft(date: DateTime): TimeLeft {
  const now = DateTime.local()
  if (now >= date) {
    return { days: 0, hours: 0, minutes: 0 }
  }
  const { days, hours, minutes } = date.diff(now, ['days', 'hours', 'minutes'])
  return { days, hours, minutes: Math.ceil(minutes) }
}

@Component({
  components: { Tooltip, WalletWidget, CartItems },
})
export default class Cart extends Vue {
  private jsonRpcNetwork: Network | null = null
  private walletChainId: string | null = null
  profileImageUrl: string | null = null
  private editModeSelection = false
  
  removeAll(): void {
    this.$store.commit(CLEAR_CART)
    this.$store.commit(SAVE_CART)
  }

  dropdownItems: {callback: () => void | null; text: string; icon: string}[] = [
    {
      callback: this.removeAll,
      text: 'Remove all', icon: 'remove.svg',
    },
    {
      callback: () => {
        alert('TODO: Split evenly between projects in cart')
      },
      text: 'Split evenly', icon: 'split.svg',
    },
  ]

  get isCartFinalized(): boolean {
    return this.$store.getters.hasReallocationPhaseEnded
  }

  get isEditMode(): boolean {
    if (this.isCartFinalized) return false
    if (this.$store.getters.hasContributionPhaseEnded) {
      return this.$store.getters.hasUserContributed
        ? this.editModeSelection
        : false
    }
    if (this.$store.getters.isRoundContributionPhase) {
      return this.$store.getters.hasUserContributed
        ? this.editModeSelection
        : true
    }
    return true
  }

  private get cart(): CartItem[] {
    return this.$store.state.cart
  }

  handleEditState(): void {
    this.editModeSelection = !this.editModeSelection
  }

  toggleCart(): void {
    this.$store.commit(TOGGLE_SHOW_CART_PANEL)
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
      this.$store.dispatch(LOAD_CONTRIBUTOR_DATA)
    }
  }

  get tokenSymbol(): string {
    const currentRound = this.$store.state.currentRound
    return currentRound ? currentRound.nativeTokenSymbol : ''
  }

  get contribution(): BigNumber {
    return this.$store.state.contribution || BigNumber.from(0)
  }

  get filteredCart(): CartItem[] {
    // Hide cleared items
    return this.cart.filter((item) => !item.isCleared)
  }

  get isCartEmpty(): boolean {
    return (
      this.$store.state.currentUser &&
      this.$store.state.contribution !== null &&
      this.$store.state.contribution.isZero() &&
      this.filteredCart.length === 0
    )
  }

  formatAmount(value: BigNumber): string {
    const decimals = this.$store.state.currentRound.nativeTokenDecimals
    return formatAmount(value, decimals)
  }

  isAmountValid(value: string): boolean {
    const currentRound = this.$store.state.currentRound
    if (!currentRound) {
      // Skip validation
      return true
    }
    const { nativeTokenDecimals, voiceCreditFactor } = currentRound
    let amount
    try {
      amount = parseFixed(value, nativeTokenDecimals)
    } catch {
      return false
    }
    if (amount.lt(BigNumber.from(0))) {
      return false
    }
    const normalizedValue = FixedNumber
      .fromValue(
        amount.div(voiceCreditFactor).mul(voiceCreditFactor),
        nativeTokenDecimals,
      )
      .toUnsafeFloat().toString()
    return normalizedValue === value
  }

  hasContributorActionBtn(): boolean {
    // Show cart action button:
    // - if there are items in cart
    // - if contribution can be withdrawn
    // - if contributor data has been lost
    return this.$store.state.currentRound && (
      this.cart.length > 0 || !this.contribution.isZero()
    )
  }

  get startDateCountdown(): string {
    return formatDateFromNow(this.$store.state.currentRound?.startTime)
  }

  get contributionTimeLeft(): TimeLeft {
    return timeLeft(this.$store.state.currentRound.signUpDeadline)
  }

  get reallocationTimeLeft(): TimeLeft {
    return timeLeft(this.$store.state.currentRound.votingDeadline)
  }

  private isFormValid(): boolean {
    const invalidCount = this.cart.filter((item) => {
      return this.isAmountValid(item.amount) === false
    }).length
    return invalidCount === 0
  }

  getTotal(): BigNumber {
    const { nativeTokenDecimals, voiceCreditFactor } = this.$store.state.currentRound
    return this.cart.reduce((total: BigNumber, item: CartItem) => {
      let amount
      try {
        amount = parseFixed(item.amount, nativeTokenDecimals)
      } catch {
        return total
      }
      return total.add(amount.div(voiceCreditFactor).mul(voiceCreditFactor))
    }, BigNumber.from(0))
  }

  private isGreaterThanMax(): boolean {
    const decimals = this.$store.state.currentRound.nativeTokenDecimals
    const maxContributionAmount = BigNumber.from(10)
      .pow(BigNumber.from(decimals))
      .mul(MAX_CONTRIBUTION_AMOUNT)
    return this.getTotal().gt(maxContributionAmount)
  }

  private isGreaterThanInitialContribution(): boolean {
    return this.getTotal().gt(this.contribution)
  }

  get balance(): string | null {
    return commify(formatUnits(this.$store.state.currentUser?.balance, 18)) ?? null
  }

  get errorMessage(): string | null {
    const currentUser = this.$store.state.currentUser
    const currentRound = this.$store.state.currentRound
    if (!currentUser) {
      return 'Please connect your wallet'
    } else if (currentUser.isVerified === null) {
      return '' // No error: waiting for verification check
    } else if (!currentUser.isVerified && userRegistryType === 'brightid') {
      return 'To contribute, you need to set up BrightID.'
    } else if (!this.isFormValid()) {
      return 'Only numbers in your contributions please.'
    } else if (this.cart.length > MAX_CART_SIZE) {
      return `Your cart can't include over ${MAX_CART_SIZE} projects.`
    } else if (currentRound.status === RoundStatus.Cancelled) {
      return 'Sorry, we\'ve had to cancel this funding round.'
    } else if (DateTime.local() >= currentRound.votingDeadline) {
      return 'The funding round has ended.'
    } else if (currentRound.messages + this.cart.length >= currentRound.maxMessages) {
      return 'The limit on the number of votes has been reached'
    } else {
      const total = this.getTotal()
      if (this.contribution.isZero()) {
        // Contributing
        if (DateTime.local() >= currentRound.signUpDeadline) {
          return 'Contributions are over for this funding round.'
          // the above error might not be necessary now we have our cart states in the HTML above
        } else if (currentRound.contributors >= currentRound.maxContributors) {
          return 'The limit on the number of contributors has been reached'
        } else if (total.eq(BigNumber.from(0)) && !this.isCartEmpty) {
          return `Your total must be more then 0 ${currentRound.nativeTokenSymbol}`
        } else if (currentUser.balance === null) {
          return '' // No error: waiting for balance
        } else if (total.gt(currentUser.balance)) {
          const balanceDisplay = formatAmount(
            currentUser.balance,
            currentRound.nativeTokenDecimals,
          )
          return `Not enough funds. Your balance is ${balanceDisplay} ${currentRound.nativeTokenSymbol}.`
        } else if (this.isGreaterThanMax()) {
          return `Your contribution is too generous. The max contribution is ${MAX_CONTRIBUTION_AMOUNT} ${currentRound.nativeTokenSymbol}.`
        } else {
          return null
        }
      } else {
        // Reallocating funds
        if (!this.$store.state.contributor) {
          return 'Contributor key is not found'
        } else if (this.isGreaterThanInitialContribution()) {
          return 'Your new total can\'t be more than your original contribution.'
        } else {
          return null
        }
      }
    }
  }

  hasUnallocatedFunds(): boolean {
    return (
      this.errorMessage === null &&
      !this.contribution.isZero() &&
      this.getTotal().lt(this.contribution)
    )
  }

  get canRegisterWithBrightId(): boolean {
    return userRegistryType === 'brightid' && !this.$store.state.currentUser?.isVerified
  }
  // TODO: Check that we are pre-reallocation phase
  // Double check logic with Contribute button

  canBuyWxdai(): boolean {
    return (
      this.$store.state.currentRound?.nativeTokenSymbol === 'WXDAI' &&
      this.errorMessage !== null &&
      this.errorMessage.startsWith('Your balance is')
    )
  }

  registerWithBrightId(): void {
    this.$modal.show(
      BrightIdModal,
      { },
      { width: 500 },
    )
  }

  submitCart(event) {
    event.preventDefault()
    const { nativeTokenDecimals, voiceCreditFactor } = this.$store.state.currentRound
    const votes = this.cart.map((item: CartItem) => {
      const amount = parseFixed(item.amount, nativeTokenDecimals)
      const voiceCredits = amount.div(voiceCreditFactor)
      return [item.index, voiceCredits]
    })
    this.$modal.show(
      this.contribution.isZero() ? ContributionModal : ReallocationModal,
      { votes },
      { width: 500 },
    )
    this.editModeSelection = false
  }

  canWithdrawContribution(): boolean {
    return (
      this.$store.state.currentRound?.status === RoundStatus.Cancelled &&
      !this.contribution.isZero()
    )
  }

  withdrawContribution(): void {
    this.$modal.show(
      WithdrawalModal,
    )
  }

  get showCollapseCart(): boolean {
    // Hide cart toggle button when directly on `/cart` path
    return this.$route.name !== 'cart'
  }

  openDropdown(): void {
    document.getElementById('cart-dropdown')?.classList.toggle('show')
  }

  scrollToBottom(): void {
    const el = document.getElementById('cart-bottom-scroll-point')
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropdown-btn')) {
    const dropdowns = document.getElementsByClassName('button-menu')
    let i: number
    for (i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i]
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show')
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

h2 {
  line-height: 130%;
}

.cart-container {
  box-sizing: border-box;
  position: relative;
  background: $bg-primary-color;
  gap: 1rem;
  height: 100%;
  padding: 1rem 0rem;
  padding-top: 0rem;
  width: 100%;

  @media (max-width: $breakpoint-m) {
    padding: 0rem;
  }
  @media (max-width: $breakpoint-s) {
    padding: 1rem 0rem;
  }

}

.balance {
  font-size: 16px;
  font-weight: 600;
  font-family: "Glacial Indifference", sans-serif;
} 

.reallocation-intro {
  padding: 1rem;
  padding-top: 0rem;
  margin-bottom: 1rem;
  font-size: 14px;
}

.profile-info-round {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.5rem;
  width: 100%;
}

.profile-info-balance img {
  height: 16px;
  width: 16px;
}

.button-container {
  width: 100%;
  padding: 0rem 1rem;
}

.time-left {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  margin: 1rem 0rem;
}

.cart-title-bar {
  position: sticky;
  padding: 1rem;  
  top: 0;
  background: $bg-primary-color;
  @media (max-width: $breakpoint-m) {
    justify-content: space-between;
  }
  & > h2 {
    margin: 0;
    width: 100%;
    text-align: center;
    @media (max-width: $breakpoint-m) {
      margin-left: 1rem;
    }
  }
}

.flex-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0rem 1rem;
}

.flex {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.flex-row-reallocation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0rem 1rem;
  margin: 1rem 0;
}

.absolute-left {
  /* position: absolute;
  left: 0; */
  /* margin-left: 1rem; */
}

.absolute-right {
  position: absolute;
  right: 1rem;
}

.cart-btn {
  @include button(white, $bg-light-color, 1px solid rgba(115,117,166,0.3));
  border: 0px solid #fff;
  background: transparent;
  padding: 0.75rem 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  gap: 0.5rem;
  margin-right: -0.5rem;
  &:hover {
    background: $bg-secondary-color;
    gap: 0.75rem;
    margin-right: -0.75rem;
  }
}

.cart {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: $bg-primary-color;
}

.empty-cart {
  font-size: 16px;
  font-weight: 400;
  margin: 1rem;
  padding: 1.5rem 1.5rem;
  background: $bg-primary-color;

  img {
    height: 70px;
  }

  h3 {
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 25px;
    font-weight: 700;
  }

  div {
    color: #d5d4d7;
  }
}

.total-bar {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  position: sticky;
  bottom: 0;
  padding: 1rem;
  justify-content: space-between;
  background: $bg-primary-color;
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  font-family: "Glacial Indifference", sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  @media (max-width: $breakpoint-m) {
    position: fixed;
    bottom: 4rem;
    width: 100%;
  }
  @media (max-width: $breakpoint-s) {
    position: fixed;
    bottom: 4rem;
    width: 100%;
    padding: 1rem;
  }
}

.total-label {
  font-family: "Inter";
  font-size: 1rem;
  line-height: 0;
  margin-top: 0.125rem;
  text-transform: uppercase;
  margin-right: 1rem;
}


.balance {
  padding: 1rem;
  background: $bg-primary-color;
  border-bottom: 1px solid #000000;
  border-top: 1px solid #000000;
  display: flex;
  justify-content: space-between;
}

.close-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  &:hover {
    transform: scale(1.01);
  }
}

.submit-btn-wrapper {
  align-self: flex-end;
  box-sizing: border-box;
  background: $bg-primary-color;
  border-top: 1px solid #000000;
  text-align: center;
  gap: 0.5rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  position: relative;
  @media (max-width: $breakpoint-m) {
    padding: 2rem;
  }

  .submit-error {
    color: $warning-color;
    margin: 1.5rem 0rem;
    margin-bottom: 0rem;
    padding: 0 1.5rem;
  }

  .btn-action {
    padding-left: 0;
    padding-right: 0;
    width: 100%;
  }  
}

.p1 {
  padding: 1rem;
  width: 100%;
}

.mt1 {
  margin-top: 1rem;
  width: fit-content;
}

.ml1{
  margin-left: 1rem;
}

.moon-emoji {
  font-size: 4rem;
}

.dropdown {
  position: relative;
  display: inline-block;

  img.dropdown-btn {
    margin: 0;
  }

  .button-menu {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 2rem;
    right: 0.5rem;
    background: $bg-secondary-color;
    border: 1px solid rgba(115,117,166,0.3);
    border-radius: 0.5rem;
    min-width: 160px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
    cursor: pointer;
    overflow: hidden;

    .dropdown-item {
      display: flex;
      align-items: center;
      padding: 0.25rem; 
      padding-left: 1rem;
      gap: 0.5rem;
      color: #fff;
      &:hover {
        background: $bg-light-color;
      }
      
      .item-text {
        margin: 0;
        color: #fff;
      }
    }
  }

  .show {
    display: flex;
  }
}

</style>