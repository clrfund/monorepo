import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import { BigNumber } from 'ethers'

import {
  MAX_CART_SIZE,
  CartItem,
  Contributor,
  getCartStorageKey,
  serializeCart,
  deserializeCart,
  getContributorStorageKey,
  serializeContributorData,
  deserializeContributorData,
  getContributionAmount,
} from '@/api/contributions'
import { RoundInfo, RoundStatus, getRoundInfo } from '@/api/round'
import { storage } from '@/api/storage'
import { Tally, getTally } from '@/api/tally'
import { User, isVerifiedUser, getTokenBalance } from '@/api/user'
import {
  LOAD_ROUND_INFO,
  LOAD_USER_INFO,
  SAVE_CART,
  CLEAR_CART,
  LOAD_CART,
  SAVE_CONTRIBUTOR_DATA,
  LOAD_CONTRIBUTOR_DATA,
} from './action-types'
import {
  SET_CURRENT_USER,
  SET_CURRENT_ROUND_ADDRESS,
  SET_CURRENT_ROUND,
  SET_TALLY,
  SET_CONTRIBUTOR,
  SET_CONTRIBUTION,
  ADD_CART_ITEM,
  UPDATE_CART_ITEM,
  REMOVE_CART_ITEM,
} from './mutation-types'

Vue.use(Vuex)

interface RootState {
  currentUser: User | null;
  currentRoundAddress: string | null;
  currentRound: RoundInfo | null;
  tally: Tally | null;
  cart: CartItem[];
  contributor: Contributor | null;
  contribution: BigNumber | null;
}

const state: RootState = {
  currentUser: null,
  currentRoundAddress: null,
  currentRound: null,
  tally: null,
  cart: new Array<CartItem>(),
  contributor: null,
  contribution: null,
}

export const mutations = {
  [SET_CURRENT_USER](state, user: User | null) {
    state.currentUser = user
  },
  [SET_CURRENT_ROUND_ADDRESS](state, address: string) {
    state.currentRoundAddress = address
    // Reset round info and contribution amount
    state.currentRound = null
    state.contribution = null
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
    } else if (state.cart[itemIndex].isCleared) {
      // Restore cleared item
      Vue.set(state.cart, itemIndex, addedItem)
    } else {
      throw new Error('item is already in the cart')
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
      // TODO: the contribution is null when the cart is being cleared after logout
      // so this operation should be allowed. Looking for a better solution.
      // throw new Error('invalid operation')
      state.cart.splice(itemIndex, 1)
    } else if (state.contribution.isZero() || state.cart.length > MAX_CART_SIZE) {
      state.cart.splice(itemIndex, 1)
    } else {
      // The number of MACI messages can't go down after initial submission
      // so we just clear contribution amount and mark item with a flag
      Vue.set(state.cart, itemIndex, { ...removedItem, amount: '0', isCleared: true })
    }
  },
}

const actions = {
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
  async [LOAD_USER_INFO]({ commit, state }) {
    if (state.currentRound && state.currentUser) {
      let isVerified = state.currentUser.isVerified
      if (!isVerified) {
        isVerified = await isVerifiedUser(
          state.currentRound.userRegistryAddress,
          state.currentUser.walletAddress,
        )
      }
      const balance = await getTokenBalance(
        state.currentRound.nativeTokenAddress,
        state.currentUser.walletAddress,
      )
      let contribution = state.contribution
      if (!contribution || contribution.isZero()) {
        contribution = await getContributionAmount(
          state.currentRound.fundingRoundAddress,
          state.currentUser.walletAddress,
        )
        commit(SET_CONTRIBUTION, contribution)
      }
      commit(SET_CURRENT_USER, {
        ...state.currentUser,
        isVerified,
        balance,
      })
    }
  },
  [SAVE_CART]({ state }) {
    const serializedCart = serializeCart(state.cart)
    storage.setItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getCartStorageKey(state.currentRound.fundingRoundAddress),
      serializedCart,
    )
  },
  [CLEAR_CART]({ commit, state }) {
    state.cart.slice().forEach((item) => {
      commit(REMOVE_CART_ITEM, item)
    })
  },
  [LOAD_CART]({ commit, dispatch, state }) {
    const data = storage.getItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getCartStorageKey(state.currentRound.fundingRoundAddress),
    )
    const cart = deserializeCart(data)
    dispatch(CLEAR_CART)
    for (const item of cart) {
      commit(ADD_CART_ITEM, item)
    }
  },
  [SAVE_CONTRIBUTOR_DATA]({ state }) {
    const serializedData = serializeContributorData(state.contributor)
    storage.setItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getContributorStorageKey(state.currentRound.fundingRoundAddress),
      serializedData,
    )
  },
  [LOAD_CONTRIBUTOR_DATA]({ commit, state }) {
    const data = storage.getItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getContributorStorageKey(state.currentRound.fundingRoundAddress),
    )
    const contributor = deserializeContributorData(data)
    if (contributor) {
      commit(SET_CONTRIBUTOR, contributor)
    }
  },
}

const store: StoreOptions<RootState> = {
  state,
  mutations,
  actions,
  modules: {},
}

export default new Vuex.Store(store)
