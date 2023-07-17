import { defineStore } from 'pinia'
import { BigNumber } from 'ethers'
import {
  type CartItem,
  type Contributor,
  deserializeCart,
  getContributorIndex,
  getCartStorageKey,
  MAX_CART_SIZE,
  serializeCart,
} from '@/api/contributions'
import { getCommittedCart } from '@/api/cart'
import { operator, chain, ThemeMode, recipientRegistryType, recipientJoinDeadlineConfig } from '@/api/core'
import { type RoundInfo, RoundStatus, getRoundInfo } from '@/api/round'
import { getTally, type Tally } from '@/api/tally'
import { type Factory, getFactoryInfo } from '@/api/factory'
import { getMACIFactoryInfo, type MACIFactory } from '@/api/maci-factory'
import { isSameAddress } from '@/utils/accounts'
import { storage } from '@/api/storage'
import { getSecondsFromNow, hasDateElapsed } from '@/utils/dates'
import { useRecipientStore } from './recipient'
import { useUserStore } from './user'
import { getAssetsUrl } from '@/utils/url'
import { getTokenLogo } from '@/utils/tokens'
import { assert, ASSERT_MISSING_ROUND, ASSERT_MISSING_SIGNATURE, ASSERT_NOT_CONNECTED_WALLET } from '@/utils/assert'
import { Keypair } from '@clrfund/maci-utils'

export type AppState = {
  isAppReady: boolean
  cart: CartItem[]
  cartEditModeSelected: boolean
  committedCart: CartItem[]
  cartLoaded: boolean
  contribution: BigNumber | null
  contributor: Contributor | null
  hasVoted: boolean
  currentRound: RoundInfo | null
  currentRoundAddress: string | null
  showCartPanel: boolean
  tally: Tally | null
  theme: string | null
  factory: Factory | null
  maciFactory: MACIFactory | null
  showSimpleLeaderboard: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    isAppReady: false,
    cart: new Array<CartItem>(),
    cartEditModeSelected: false,
    committedCart: new Array<CartItem>(),
    cartLoaded: false,
    contribution: null,
    contributor: null,
    hasVoted: false,
    currentRound: null,
    currentRoundAddress: null,
    showCartPanel: false,
    tally: null,
    theme: null,
    factory: null,
    maciFactory: null,
    showSimpleLeaderboard: true,
  }),
  getters: {
    recipientJoinDeadline: state => {
      if (recipientJoinDeadlineConfig) {
        return recipientJoinDeadlineConfig
      }

      const recipientStore = useRecipientStore()
      if (!state.currentRound || !recipientStore.recipientRegistryInfo) {
        return null
      }

      const challengePeriodDuration =
        recipientRegistryType === 'optimistic' ? recipientStore.recipientRegistryInfo.challengePeriodDuration : 0

      const deadline = state.currentRound.signUpDeadline.minus({
        seconds: challengePeriodDuration,
      })

      return deadline.isValid ? deadline : state.currentRound.signUpDeadline
    },
    isRoundReallocationPhase: (state): boolean => {
      return !!state.currentRound && state.currentRound.status === RoundStatus.Reallocating
    },
    canUserReallocate(): boolean {
      return this.hasUserContributed && (this.isRoundContributionPhase || this.isRoundReallocationPhase)
    },
    isRoundContributionPhase: (state): boolean => {
      return !!state.currentRound && state.currentRound.status === RoundStatus.Contributing
    },
    isRoundContributionPhaseEnding(): boolean {
      return (
        !!this.currentRound &&
        this.isRoundContributionPhase &&
        getSecondsFromNow(this.currentRound.signUpDeadline) < 24 * 60 * 60
      )
    },
    isRoundTallying: (state): boolean => {
      return !!state.currentRound && state.currentRound.status === RoundStatus.Tallying
    },
    isRoundFinalized: (state): boolean => {
      return !!state.currentRound && state.currentRound.status === RoundStatus.Finalized
    },
    isRoundCancelled:
      state =>
      (roundInfo?: RoundInfo | null): boolean => {
        const round = roundInfo || state.currentRound
        return !!round && round.status === RoundStatus.Cancelled
      },
    isCurrentRound:
      state =>
      (roundAddress: string): boolean => {
        const currentRoundAddress = state.currentRoundAddress || ''
        return isSameAddress(roundAddress, currentRoundAddress)
      },
    // BUG: https://github.com/vuejs/pinia/discussions/1076
    isRoundJoinOnlyPhase(): boolean {
      return !!this.currentRound && this.isRoundJoinPhase && !hasDateElapsed(this.currentRound.startTime)
    },
    isRoundJoinPhase(): boolean {
      if (!this.isAppReady) {
        return false
      }
      if (!this.recipientJoinDeadline) {
        // no deadline means still accepting application
        return true
      }
      return !hasDateElapsed(this.recipientJoinDeadline)
    },
    isRoundContributorLimitReached: state => {
      return !!state.currentRound && state.currentRound.maxContributors <= state.currentRound.contributors
    },
    hasContributionPhaseEnded(): boolean {
      return (
        !!this.currentRound &&
        (hasDateElapsed(this.currentRound.signUpDeadline) ||
          this.isRoundContributorLimitReached ||
          this.isMessageLimitReached)
      )
    },
    isMessageLimitReached: (state): boolean => {
      return !!state.currentRound && state.currentRound.maxMessages <= state.currentRound.messages
    },
    hasUserContributed: (state): boolean => {
      const userStore = useUserStore()
      return !!userStore.currentUser && !!state.contribution && !state.contribution.isZero()
    },
    operator: (): string => {
      return operator
    },
    userRegistryAddress: (state): string | undefined => {
      const { currentRound, factory } = state

      if (currentRound) {
        return currentRound.userRegistryAddress
      }

      if (factory) {
        return factory.userRegistryAddress
      }
    },
    matchingPool: (state): BigNumber => {
      const { currentRound, factory } = state

      let matchingPool = BigNumber.from(0)

      if (factory) {
        matchingPool = factory.matchingPool
      }

      if (currentRound) {
        matchingPool = currentRound.matchingPool
      }

      return matchingPool
    },
    nativeTokenSymbol: (state): string => {
      const { currentRound, factory } = state

      let nativeTokenSymbol = ''

      if (factory) {
        nativeTokenSymbol = factory.nativeTokenSymbol
      }

      if (currentRound) {
        nativeTokenSymbol = currentRound.nativeTokenSymbol
      }

      return nativeTokenSymbol
    },
    nativeTokenDecimals: (state): number | undefined => {
      const { currentRound, factory } = state

      let nativeTokenDecimals

      if (factory) {
        nativeTokenDecimals = factory.nativeTokenDecimals
      }

      if (currentRound) {
        nativeTokenDecimals = currentRound.nativeTokenDecimals
      }

      return nativeTokenDecimals
    },
    nativeTokenAddress: (state): string => {
      const { currentRound, factory } = state

      let nativeTokenAddress = ''

      if (factory) {
        nativeTokenAddress = factory.nativeTokenAddress
      }

      if (currentRound) {
        nativeTokenAddress = currentRound.nativeTokenAddress
      }

      return nativeTokenAddress
    },
    tokenLogoUrl(): string {
      return getAssetsUrl(getTokenLogo(this.nativeTokenSymbol))
    },
    chainCurrencyLogoUrl(): string {
      return getAssetsUrl(getTokenLogo(chain.currency))
    },
    isRecipientRegistryFull(): boolean {
      return this.recipientSpacesRemaining === 0
    },
    isRecipientRegistryFillingUp(): boolean {
      return this.recipientSpacesRemaining !== null && this.recipientSpacesRemaining < 20
    },
    recipientSpacesRemaining: (state): number | null => {
      const recipientStore = useRecipientStore()
      if (!state.currentRound || !recipientStore.recipientRegistryInfo) {
        return null
      }
      const maxRecipients = state.currentRound.maxRecipients
      const recipientCount = recipientStore.recipientRegistryInfo.recipientCount
      return maxRecipients - recipientCount
    },
    maxRecipients: (state): number | undefined => {
      const { currentRound, maciFactory } = state

      if (currentRound) {
        return currentRound.maxRecipients
      }

      if (maciFactory) {
        return maciFactory.maxRecipients
      }
    },
    hasReallocationPhaseEnded(): boolean {
      return !!this.currentRound && (hasDateElapsed(this.currentRound.votingDeadline) || this.isMessageLimitReached)
    },
    hasUserVoted: (state): boolean => {
      return state.hasVoted
    },
    categoryLocaleKey:
      () =>
      (category = ''): string => {
        try {
          return category ? `dynamic.category.${category.toLowerCase()}` : ''
        } catch {
          return category
        }
      },
  },
  actions: {
    setHasVote(hasVoted: boolean) {
      this.hasVoted = hasVoted
    },
    toggleLeaderboardView() {
      this.showSimpleLeaderboard = !this.showSimpleLeaderboard
    },
    async loadRoundInfo() {
      const roundAddress = this.currentRoundAddress
      if (roundAddress === null) {
        this.currentRound = null
        return
      }
      //TODO: update to take factory address as a parameter, default to env. variable
      const round = await getRoundInfo(roundAddress)
      this.currentRound = round
    },
    selectRound(roundAddress: string) {
      if (this.currentRoundAddress) {
        const recipientStore = useRecipientStore()
        this.contribution = null
        this.contributor = null
        this.cart = []
        this.cartLoaded = false
        recipientStore.recipientRegistryAddress = null
        recipientStore.recipientRegistryInfo = null
        this.currentRound = null
      }
      this.currentRoundAddress = roundAddress
    },
    async loadCart() {
      const userStore = useUserStore()

      assert(userStore.currentUser, ASSERT_NOT_CONNECTED_WALLET)
      assert(userStore.currentUser.encryptionKey, ASSERT_MISSING_SIGNATURE)
      assert(this.currentRound?.fundingRoundAddress, ASSERT_MISSING_ROUND)

      const data = await storage.getItem(
        userStore.currentUser.walletAddress,
        userStore.currentUser.encryptionKey,
        getCartStorageKey(this.currentRound.fundingRoundAddress),
      )

      const cart = deserializeCart(data)
      this.cart = []
      for (const item of cart) {
        this.addCartItem(item)
      }
    },
    addCartItem(addedItem: CartItem) {
      const itemIndex = this.cart.findIndex(item => {
        return item.id === addedItem.id
      })
      if (itemIndex === -1) {
        // Look for cleared item
        const clearedItemIndex = this.cart.findIndex(item => {
          return item.isCleared
        })
        if (clearedItemIndex !== -1) {
          // Replace
          this.cart[clearedItemIndex] = addedItem
        } else {
          this.cart.push(addedItem)
        }
      } else {
        /* eslint-disable-next-line no-console */
        console.warn('item is already in the cart')
        this.cart[itemIndex] = addedItem
      }
    },
    removeCartItem(removedItem: CartItem) {
      const itemIndex = this.cart.findIndex(item => {
        return item.id === removedItem.id
      })
      if (itemIndex === -1) {
        throw new Error('item is not in the cart')
      } else if (this.contribution === null) {
        throw new Error('invalid operation')
      } else if (this.contribution.isZero() || this.cart.length > MAX_CART_SIZE) {
        this.cart.splice(itemIndex, 1)
      } else {
        // The number of MACI messages can't go down after initial submission
        // so we just clear contribution amount and mark item with a flag
        this.cart[itemIndex] = {
          ...removedItem,
          amount: '0',
          isCleared: true,
        }
      }
    },
    clearCart() {
      this.cart = []
    },
    saveCart() {
      const userStore = useUserStore()
      assert(userStore.currentUser, ASSERT_NOT_CONNECTED_WALLET)
      assert(userStore.currentUser.encryptionKey, ASSERT_MISSING_SIGNATURE)
      assert(this.currentRound, ASSERT_MISSING_ROUND)

      const serializedCart = serializeCart(this.cart)
      storage.setItem(
        userStore.currentUser.walletAddress,
        userStore.currentUser.encryptionKey,
        getCartStorageKey(this.currentRound.fundingRoundAddress),
        serializedCart,
      )
    },
    saveCommittedCart() {
      this.committedCart = [...this.cart.filter(item => Number(item.amount) !== 0)]
    },
    updateCartItem(updatedItem: CartItem) {
      const itemIndex = this.cart.findIndex(item => {
        return item.id === updatedItem.id
      })
      if (itemIndex === -1) {
        throw new Error('item is not in the cart')
      }
      this.cart[itemIndex] = updatedItem
    },
    restoreCommittedCartToLocalCart() {
      // Spread to avoid reference
      this.cart = [...this.committedCart]
    },

    toggleEditSelection(isOpen?: boolean | undefined) {
      // Handle the case of both null and undefined
      if (isOpen != null) {
        this.cartEditModeSelected = isOpen
      } else {
        this.cartEditModeSelected = !this.cartEditModeSelected
      }
    },
    toggleShowCartPanel(isOpen?: boolean | undefined) {
      // Handle the case of both null and undefined
      if (isOpen != null) {
        this.showCartPanel = isOpen
      } else {
        this.showCartPanel = !this.showCartPanel
      }
    },
    toggleTheme(theme?: string) {
      if (theme) {
        this.theme = theme
      } else {
        this.theme = this.theme === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT
      }
    },
    async loadCommittedCart() {
      const userStore = useUserStore()
      if (!userStore.currentUser?.walletAddress || !userStore.currentUser.encryptionKey || !this.currentRound) {
        return
      }

      this.committedCart = await getCommittedCart(
        this.currentRound,
        userStore.currentUser.encryptionKey,
        userStore.currentUser.walletAddress,
      )

      if (this.committedCart.length > 0) {
        // only overwrite the uncommitted cart if there's committed cart
        this.restoreCommittedCartToLocalCart()
      }
    },
    setContributor(contributor: Contributor | null) {
      this.contributor = contributor
    },
    setContribution(contribution: BigNumber | null) {
      this.contribution = contribution
    },
    async loadContributorData() {
      const userStore = useUserStore()
      if (!userStore.currentUser || !userStore.currentUser.encryptionKey || !this.currentRound) {
        return
      }

      const contributorKeypair = Keypair.createFromSeed(userStore.currentUser.encryptionKey)
      const stateIndex = await getContributorIndex(this.currentRound.fundingRoundAddress, contributorKeypair.pubKey)

      if (!stateIndex) {
        // if no contributor index, user has not contributed
        return
      }

      this.contributor = {
        keypair: contributorKeypair,
        stateIndex,
      }
    },
    async loadFactoryInfo() {
      const factory = await getFactoryInfo()
      this.factory = factory
    },
    async loadMACIFactoryInfo() {
      const factory = await getMACIFactoryInfo()
      this.maciFactory = factory
    },
    async loadTally() {
      const currentRound = this.currentRound
      if (currentRound && currentRound.status === RoundStatus.Finalized) {
        const tally = await getTally(currentRound.fundingRoundAddress)
        this.tally = tally
      }
    },
  },
})
