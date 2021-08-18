// Libraries
import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import { BigNumber } from 'ethers'
import { DateTime } from 'luxon'

// API
import {
  MAX_CART_SIZE,
  CartItem,
  Contributor,
  getCartStorageKey,
  getCommittedCartStorageKey,
  serializeCart,
  deserializeCart,
  getContributorStorageKey,
  serializeContributorData,
  deserializeContributorData,
  getContributionAmount,
  isContributionWithdrawn,
} from '@/api/contributions'
import { loginUser, logoutUser } from '@/api/gun'
import { getRecipientRegistryAddress } from '@/api/projects'
import { RoundInfo, RoundStatus, getRoundInfo } from '@/api/round'
import { storage } from '@/api/storage'
import { Tally, getTally } from '@/api/tally'
import {
  User,
  getEtherBalance,
  getTokenBalance,
  isVerifiedUser,
} from '@/api/user'
import {
  getRegistryInfo,
  RecipientApplicationData,
  RegistryInfo,
} from '@/api/recipient-registry-optimistic'

// Constants
import {
  LOAD_BRIGHT_ID,
  LOAD_CART,
  LOAD_COMMITTED_CART,
  LOAD_CONTRIBUTOR_DATA,
  LOAD_RECIPIENT_REGISTRY_INFO,
  LOAD_ROUND_INFO,
  LOAD_USER_INFO,
  LOGIN_USER,
  LOGOUT_USER,
  SAVE_CART,
  SAVE_COMMITTED_CART_DISPATCH,
  SAVE_CONTRIBUTOR_DATA,
  SELECT_ROUND,
  UNWATCH_CART,
  UNWATCH_CONTRIBUTOR_DATA,
} from './action-types'
import {
  ADD_CART_ITEM,
  CLEAR_CART,
  REMOVE_CART_ITEM,
  RESTORE_COMMITTED_CART_TO_LOCAL_CART,
  SAVE_COMMITTED_CART,
  SET_CONTRIBUTION,
  SET_CONTRIBUTOR,
  SET_CURRENT_ROUND,
  SET_CURRENT_ROUND_ADDRESS,
  SET_TALLY,
  SET_CURRENT_USER,
  SET_RECIPIENT_DATA,
  RESET_RECIPIENT_DATA,
  SET_RECIPIENT_REGISTRY_ADDRESS,
  SET_RECIPIENT_REGISTRY_INFO,
  TOGGLE_SHOW_CART_PANEL,
  UPDATE_CART_ITEM,
  TOGGLE_EDIT_SELECTION,
} from './mutation-types'

// Utils
import { isSameAddress } from '@/utils/accounts'
import { getSecondsFromNow, hasDateElapsed } from '@/utils/dates'
import { UserRegistryType, userRegistryType } from '@/api/core'
import { BrightId, getBrightId } from '@/api/bright-id'

Vue.use(Vuex)

interface RootState {
  cart: CartItem[]
  cartEditModeSelected: boolean
  committedCart: CartItem[]
  contribution: BigNumber | null
  contributor: Contributor | null
  currentRound: RoundInfo | null
  currentRoundAddress: string | null
  currentUser: User | null
  recipient: RecipientApplicationData | null
  recipientRegistryAddress: string | null
  recipientRegistryInfo: RegistryInfo | null
  showCartPanel: boolean
  tally: Tally | null
}

const state: RootState = {
  cart: new Array<CartItem>(),
  cartEditModeSelected: false,
  committedCart: new Array<CartItem>(),
  contribution: null,
  contributor: null,
  currentRound: null,
  currentRoundAddress: null,
  currentUser: null,
  recipient: null,
  recipientRegistryAddress: null,
  recipientRegistryInfo: null,
  showCartPanel: false,
  tally: null,
}

export const mutations = {
  [TOGGLE_EDIT_SELECTION](state, isOpen: boolean | undefined) {
    // Handle the case of both null and undefined
    if (isOpen != null) {
      state.cartEditModeSelected = isOpen
    } else {
      state.cartEditModeSelected = !state.cartEditModeSelected
    }
  },
  [SET_RECIPIENT_REGISTRY_ADDRESS](state, address: string) {
    state.recipientRegistryAddress = address
  },
  [SET_RECIPIENT_REGISTRY_INFO](state, info: RegistryInfo) {
    state.recipientRegistryInfo = info
  },
  [SET_CURRENT_USER](state, user: User | null) {
    state.currentUser = user
  },
  [SET_CURRENT_ROUND_ADDRESS](state, address: string) {
    state.currentRoundAddress = address
  },
  [SET_CURRENT_ROUND](state, round: RoundInfo) {
    state.currentRound = round
  },
  [SET_TALLY](state, tally: Tally) {
    state.tally = tally
  },
  [SET_CONTRIBUTOR](state, contributor: Contributor | null) {
    state.contributor = contributor
  },
  [SET_CONTRIBUTION](state, contribution: BigNumber | null) {
    state.contribution = contribution
  },
  [ADD_CART_ITEM](state, addedItem: CartItem) {
    const itemIndex = state.cart.findIndex((item) => {
      return item.id === addedItem.id
    })
    if (itemIndex === -1) {
      // Look for cleared item
      const clearedItemIndex = state.cart.findIndex((item) => {
        return item.isCleared
      })
      if (clearedItemIndex !== -1) {
        // Replace
        Vue.set(state.cart, clearedItemIndex, addedItem)
      } else {
        state.cart.push(addedItem)
      }
    } else {
      /* eslint-disable-next-line no-console */
      console.warn('item is already in the cart')
      Vue.set(state.cart, itemIndex, addedItem)
    }
  },
  [UPDATE_CART_ITEM](state, updatedItem: CartItem) {
    const itemIndex = state.cart.findIndex((item) => {
      return item.id === updatedItem.id
    })
    if (itemIndex === -1) {
      throw new Error('item is not in the cart')
    }
    Vue.set(state.cart, itemIndex, updatedItem)
  },
  [REMOVE_CART_ITEM](state, removedItem: CartItem) {
    const itemIndex = state.cart.findIndex((item) => {
      return item.id === removedItem.id
    })
    if (itemIndex === -1) {
      throw new Error('item is not in the cart')
    } else if (state.contribution === null) {
      throw new Error('invalid operation')
    } else if (
      state.contribution.isZero() ||
      state.cart.length > MAX_CART_SIZE
    ) {
      state.cart.splice(itemIndex, 1)
    } else {
      // The number of MACI messages can't go down after initial submission
      // so we just clear contribution amount and mark item with a flag
      Vue.set(state.cart, itemIndex, {
        ...removedItem,
        amount: '0',
        isCleared: true,
      })
    }
  },
  [CLEAR_CART](state) {
    state.cart = []
  },
  [SET_RECIPIENT_DATA](
    state,
    payload: {
      updatedData: RecipientApplicationData
      step: string
      stepNumber: number
    }
  ) {
    if (!state.recipient) {
      state.recipient = payload.updatedData
    } else {
      state.recipient[payload.step] = payload.updatedData[payload.step]
    }
  },
  [RESET_RECIPIENT_DATA](state) {
    state.recipient = null
  },
  [TOGGLE_SHOW_CART_PANEL](state, isOpen: boolean | undefined) {
    // Handle the case of both null and undefined
    if (isOpen != null) {
      state.showCartPanel = isOpen
    } else {
      state.showCartPanel = !state.showCartPanel
    }
  },
  [RESTORE_COMMITTED_CART_TO_LOCAL_CART](state) {
    // Spread to avoid reference
    state.cart = [...state.committedCart]
  },
  [SAVE_COMMITTED_CART](state) {
    // Spread to avoid reference
    state.committedCart = [...state.cart.filter((item) => item.amount != 0)]
  },
}

const actions = {
  [SELECT_ROUND]({ commit, dispatch, state }, roundAddress: string) {
    if (state.currentRoundAddress) {
      // Reset everything that depends on round
      dispatch(UNWATCH_CART)
      dispatch(UNWATCH_CONTRIBUTOR_DATA)
      commit(SET_CONTRIBUTION, null)
      commit(SET_CONTRIBUTOR, null)
      commit(CLEAR_CART)
      commit(SET_RECIPIENT_REGISTRY_ADDRESS, null)
      commit(SET_RECIPIENT_REGISTRY_INFO, null)
      commit(SET_CURRENT_ROUND, null)
    }
    commit(SET_CURRENT_ROUND_ADDRESS, roundAddress)
  },
  async [LOAD_ROUND_INFO]({ commit, state }) {
    const roundAddress = state.currentRoundAddress
    if (roundAddress === null) {
      commit(SET_CURRENT_ROUND, null)
      return
    }
    const round = await getRoundInfo(roundAddress)
    commit(SET_CURRENT_ROUND, round)
    if (round && round.status === RoundStatus.Finalized) {
      const tally = await getTally(roundAddress)
      commit(SET_TALLY, tally)
    }
  },
  async [LOAD_RECIPIENT_REGISTRY_INFO]({ commit, state }) {
    const recipientRegistryAddress =
      state.recipientRegistryAddress ||
      (await getRecipientRegistryAddress(state.currentRoundAddress))
    commit(SET_RECIPIENT_REGISTRY_ADDRESS, recipientRegistryAddress)

    if (recipientRegistryAddress) {
      const info = await getRegistryInfo(recipientRegistryAddress)
      commit(SET_RECIPIENT_REGISTRY_INFO, info)
    } else {
      commit(SET_RECIPIENT_REGISTRY_INFO, null)
    }
  },
  async [LOAD_USER_INFO]({ commit, state }) {
    if (state.currentRound && state.currentUser) {
      // Check if this user is in our user registry
      const isRegistered = await isVerifiedUser(
        state.currentRound.userRegistryAddress,
        state.currentUser.walletAddress
      )

      const etherBalance = await getEtherBalance(
        state.currentUser.walletAddress
      )
      const balance = await getTokenBalance(
        state.currentRound.nativeTokenAddress,
        state.currentUser.walletAddress
      )
      let contribution = state.contribution
      if (!contribution || contribution.isZero()) {
        let isWithdrawn = false
        if (state.currentRound.status === RoundStatus.Cancelled) {
          isWithdrawn = await isContributionWithdrawn(
            state.currentRound.fundingRoundAddress,
            state.currentUser.walletAddress
          )
        }
        if (isWithdrawn) {
          commit(SET_CONTRIBUTION, BigNumber.from(0))
        } else {
          contribution = await getContributionAmount(
            state.currentRound.fundingRoundAddress,
            state.currentUser.walletAddress
          )
          commit(SET_CONTRIBUTION, contribution)
        }
      }

      commit(SET_CURRENT_USER, {
        ...state.currentUser,
        isRegistered,
        balance,
        etherBalance,
      })
    }
  },
  async [LOAD_BRIGHT_ID]({ commit, state }) {
    if (state.currentUser && userRegistryType === UserRegistryType.BRIGHT_ID) {
      // If the user is registered, we assume all brightId steps as done
      let brightId: BrightId = {
        isLinked: true,
        isSponsored: true,
        isVerified: true,
      }

      if (!state.currentUser.isRegistered) {
        // If not registered, then fetch brightId data
        brightId = await getBrightId(state.currentUser.walletAddress)
      }

      commit(SET_CURRENT_USER, {
        ...state.currentUser,
        brightId,
      })
    }
  },
  [SAVE_CART]({ state }) {
    const serializedCart = serializeCart(state.cart)
    storage.setItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getCartStorageKey(state.currentRound.fundingRoundAddress),
      serializedCart
    )
  },
  [LOAD_CART]({ commit, state }) {
    storage.watchItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getCartStorageKey(state.currentRound.fundingRoundAddress),
      (data: string | null) => {
        const cart = deserializeCart(data)
        commit(CLEAR_CART)
        for (const item of cart) {
          commit(ADD_CART_ITEM, item)
        }
      }
    )
  },
  [UNWATCH_CART]({ state }) {
    if (!state.currentUser || !state.currentRound) {
      return
    }
    storage.unwatchItem(
      state.currentUser.walletAddress,
      getCartStorageKey(state.currentRound.fundingRoundAddress)
    )
  },
  [SAVE_COMMITTED_CART_DISPATCH]({ commit, state }) {
    commit(SAVE_COMMITTED_CART)
    const serializedCart = serializeCart(state.committedCart)
    storage.setItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getCommittedCartStorageKey(state.currentRound.fundingRoundAddress),
      serializedCart
    )
  },
  [LOAD_COMMITTED_CART]({ commit, state }) {
    storage.watchItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getCommittedCartStorageKey(state.currentRound.fundingRoundAddress),
      (data: string | null) => {
        const committedCart = deserializeCart(data)
        Vue.set(state, 'committedCart', committedCart)
        commit(RESTORE_COMMITTED_CART_TO_LOCAL_CART)
      }
    )
  },
  [SAVE_CONTRIBUTOR_DATA]({ state }) {
    const serializedData = serializeContributorData(state.contributor)
    storage.setItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getContributorStorageKey(state.currentRound.fundingRoundAddress),
      serializedData
    )
  },
  [LOAD_CONTRIBUTOR_DATA]({ commit, state }) {
    storage.watchItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getContributorStorageKey(state.currentRound.fundingRoundAddress),
      (data: string | null) => {
        const contributor = deserializeContributorData(data)
        if (contributor) {
          commit(SET_CONTRIBUTOR, contributor)
        }
      }
    )
  },
  [UNWATCH_CONTRIBUTOR_DATA]({ state }) {
    if (!state.currentUser || !state.currentRound) {
      return
    }
    storage.unwatchItem(
      state.currentUser.walletAddress,
      getContributorStorageKey(state.currentRound.fundingRoundAddress)
    )
  },
  async [LOGIN_USER]({ state }) {
    await loginUser(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey
    )
  },
  [LOGOUT_USER]({ commit, dispatch }) {
    dispatch(UNWATCH_CART)
    dispatch(UNWATCH_CONTRIBUTOR_DATA)
    logoutUser()
    commit(SET_CURRENT_USER, null)
    commit(SET_CONTRIBUTION, null)
    commit(SET_CONTRIBUTOR, null)
    commit(CLEAR_CART)
  },
}

const getters = {
  recipientJoinDeadline: (state: RootState): DateTime | null => {
    if (!state.currentRound || !state.recipientRegistryInfo) {
      return null
    }
    return state.currentRound.signUpDeadline.minus({
      seconds: state.recipientRegistryInfo.challengePeriodDuration,
    })
  },
  isRoundJoinPhase: (state: RootState, getters): boolean => {
    if (!state.currentRound) {
      return true
    }
    if (!state.recipientRegistryInfo) {
      return false
    }
    return !hasDateElapsed(getters.recipientJoinDeadline)
  },
  isRoundJoinOnlyPhase: (state: RootState, getters): boolean => {
    return (
      !!state.currentRound &&
      getters.isRoundJoinPhase &&
      !hasDateElapsed(state.currentRound.startTime)
    )
  },
  hasStartTimeElapsed: (state: RootState): boolean => {
    if (!state.currentRound) return true
    return hasDateElapsed(state.currentRound.startTime)
  },
  recipientSpacesRemaining: (state: RootState): number | null => {
    if (!state.currentRound || !state.recipientRegistryInfo) {
      return null
    }
    const maxRecipients = state.currentRound.maxRecipients
    const recipientCount = state.recipientRegistryInfo.recipientCount
    return maxRecipients - recipientCount
  },
  isRecipientRegistryFull: (_, getters): boolean => {
    return getters.recipientSpacesRemaining === 0
  },
  isRecipientRegistryFillingUp: (_, getters): boolean => {
    return (
      getters.recipientSpacesRemaining !== null &&
      getters.recipientSpacesRemaining < 20
    )
  },
  isRoundBufferPhase: (state: RootState, getters): boolean => {
    return (
      !!state.currentRound &&
      !getters.isJoinPhase &&
      !hasDateElapsed(state.currentRound.signUpDeadline)
    )
  },
  isRoundContributionPhase: (state: RootState): boolean => {
    return (
      !!state.currentRound &&
      state.currentRound.status === RoundStatus.Contributing
    )
  },
  isRoundContributionPhaseEnding: (state: RootState, getters): boolean => {
    return (
      !!state.currentRound &&
      getters.isRoundContributionPhase &&
      getSecondsFromNow(state.currentRound.signUpDeadline) < 24 * 60 * 60
    )
  },
  isRoundReallocationPhase: (state: RootState): boolean => {
    return (
      !!state.currentRound &&
      state.currentRound.status === RoundStatus.Reallocating
    )
  },
  isRoundTallying: (state: RootState): boolean => {
    return (
      !!state.currentRound && state.currentRound.status === RoundStatus.Tallying
    )
  },
  isRoundFinalized: (state: RootState): boolean => {
    return (
      !!state.currentRound &&
      state.currentRound.status === RoundStatus.Finalized
    )
  },
  hasContributionPhaseEnded: (state: RootState): boolean => {
    return (
      !!state.currentRound && hasDateElapsed(state.currentRound.signUpDeadline)
    )
  },
  hasReallocationPhaseEnded: (state: RootState): boolean => {
    return (
      !!state.currentRound && hasDateElapsed(state.currentRound.votingDeadline)
    )
  },
  hasUserContributed: (state: RootState): boolean => {
    return (
      !!state.currentUser &&
      !!state.contribution &&
      !state.contribution.isZero()
    )
  },
  canUserReallocate: (_, getters): boolean => {
    return (
      getters.hasUserContributed &&
      (getters.isRoundContributionPhase || getters.isRoundReallocationPhase)
    )
  },
  isRecipientRegistryOwner: (state: RootState): boolean => {
    if (!state.currentUser || !state.recipientRegistryInfo) {
      return false
    }
    return isSameAddress(
      state.currentUser.walletAddress,
      state.recipientRegistryInfo.owner
    )
  },
  isMessageLimitReached: (state: RootState): boolean => {
    return (
      !!state.currentRound &&
      state.currentRound.maxMessages <= state.currentRound.messages
    )
  },
}

const store: StoreOptions<RootState> = {
  state,
  mutations,
  actions,
  getters,
  modules: {},
}

export default new Vuex.Store(store)
