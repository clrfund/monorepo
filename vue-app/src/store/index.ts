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
  isContributionWithdrawn,
} from '@/api/contributions'
import { loginUser, logoutUser } from '@/api/gun'
import { RoundInfo, RoundStatus, getRoundInfo } from '@/api/round'
import { storage } from '@/api/storage'
import { Tally, getTally } from '@/api/tally'
import { User, isVerifiedUser, getEtherBalance, getTokenBalance } from '@/api/user'
import { RecipientApplicationData } from '@/api/recipient-registry-optimistic'
import {
  SELECT_ROUND,
  LOAD_ROUND_INFO,
  LOAD_USER_INFO,
  SAVE_CART,
  LOAD_CART,
  UNWATCH_CART,
  SAVE_CONTRIBUTOR_DATA,
  LOAD_CONTRIBUTOR_DATA,
  UNWATCH_CONTRIBUTOR_DATA,
  LOGIN_USER,
  LOGOUT_USER,
} from './action-types'
import {
  SET_RECIPIENT_REGISTRY_ADDRESS,
  SET_CURRENT_USER,
  SET_CURRENT_ROUND_ADDRESS,
  SET_CURRENT_ROUND,
  SET_TALLY,
  SET_CONTRIBUTOR,
  SET_CONTRIBUTION,
  ADD_CART_ITEM,
  UPDATE_CART_ITEM,
  REMOVE_CART_ITEM,
  CLEAR_CART,
  SET_RECIPIENT_DATA,
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
  recipientRegistryAddress: string | null;
  recipient: RecipientApplicationData | null;
}

const state: RootState = {
  recipientRegistryAddress: null,
  currentUser: null,
  currentRoundAddress: null,
  currentRound: null,
  tally: null,
  cart: new Array<CartItem>(),
  contributor: null,
  contribution: null,
  recipient: null,
}

export const mutations = {
  [SET_RECIPIENT_REGISTRY_ADDRESS](state, address: string) {
    state.recipientRegistryAddress = address
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
      throw new Error('invalid operation')
    } else if (state.contribution.isZero() || state.cart.length > MAX_CART_SIZE) {
      state.cart.splice(itemIndex, 1)
    } else {
      // The number of MACI messages can't go down after initial submission
      // so we just clear contribution amount and mark item with a flag
      Vue.set(state.cart, itemIndex, { ...removedItem, amount: '0', isCleared: true })
    }
  },
  [CLEAR_CART](state) {
    state.cart = []
  },
  [SET_RECIPIENT_DATA](state, payload: { updatedData: RecipientApplicationData; step: string; stepNumber: number }) {
    if (!state.recipient) {
      state.recipient = payload.updatedData
    } else {
      state.recipient[payload.step] = payload.updatedData[payload.step]
    }
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
  async [LOAD_USER_INFO]({ commit, state }) {
    if (state.currentRound && state.currentUser) {
      let isVerified = state.currentUser.isVerified
      if (!isVerified) {
        isVerified = await isVerifiedUser(
          state.currentRound.userRegistryAddress,
          state.currentUser.walletAddress,
        )
      }
      const etherBalance = await getEtherBalance(state.currentUser.walletAddress)
      const balance = await getTokenBalance(
        state.currentRound.nativeTokenAddress,
        state.currentUser.walletAddress,
      )
      let contribution = state.contribution
      if (!contribution || contribution.isZero()) {
        let isWithdrawn = false
        if (state.currentRound.status === RoundStatus.Cancelled) {
          isWithdrawn = await isContributionWithdrawn(
            state.currentRound.fundingRoundAddress,
            state.currentUser.walletAddress,
          )
        }
        if (isWithdrawn) {
          commit(SET_CONTRIBUTION, BigNumber.from(0))
        } else {
          contribution = await getContributionAmount(
            state.currentRound.fundingRoundAddress,
            state.currentUser.walletAddress,
          )
          commit(SET_CONTRIBUTION, contribution)
        }
      }

      commit(SET_CURRENT_USER, {
        ...state.currentUser,
        isVerified,
        balance,
        etherBalance,
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
      },
    )
  },
  [UNWATCH_CART]({ state }) {
    if (!state.currentUser || !state.currentRound) {
      return
    }
    storage.unwatchItem(
      state.currentUser.walletAddress,
      getCartStorageKey(state.currentRound.fundingRoundAddress),
    )
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
    storage.watchItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getContributorStorageKey(state.currentRound.fundingRoundAddress),
      (data: string | null) => {
        const contributor = deserializeContributorData(data)
        if (contributor) {
          commit(SET_CONTRIBUTOR, contributor)
        }
      },
    )
  },
  [UNWATCH_CONTRIBUTOR_DATA]({ state }) {
    if (!state.currentUser || !state.currentRound) {
      return
    }
    storage.unwatchItem(
      state.currentUser.walletAddress,
      getContributorStorageKey(state.currentRound.fundingRoundAddress),
    )
  },
  async [LOGIN_USER]({ state }) {
    await loginUser(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
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

const store: StoreOptions<RootState> = {
  state,
  mutations,
  actions,
  modules: {},
}

export default new Vuex.Store(store)
