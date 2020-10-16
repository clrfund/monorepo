import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import { BigNumber } from 'ethers'

import { CartItem, Contributor } from '@/api/contributions'
import { RoundInfo, RoundStatus, getRoundInfo } from '@/api/round'
import { Tally, getTally } from '@/api/tally'
import { User, isVerifiedUser } from '@/api/user'
import {
  LOAD_ROUND_INFO,
  CHECK_VERIFICATION,
} from './action-types'
import {
  SET_CURRENT_USER,
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
  currentRound: RoundInfo | null;
  tally: Tally | null;
  cart: CartItem[];
  contributor: Contributor | null;
  contribution: BigNumber;
}

const store: StoreOptions<RootState> = {
  state: {
    currentUser: null,
    currentRound: null,
    tally: null,
    cart: new Array<CartItem>(),
    contributor: null,
    contribution: BigNumber.from(0),
  },
  mutations: {
    [SET_CURRENT_USER](state, user: User | null) {
      state.currentUser = user
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
    [SET_CONTRIBUTION](state, contribution: BigNumber) {
      state.contribution = contribution
    },
    [ADD_CART_ITEM](state, addedItem: CartItem) {
      const exists = state.cart.find((item) => {
        return item.address === addedItem.address
      })
      if (!exists) {
        state.cart.push(addedItem)
      }
    },
    [UPDATE_CART_ITEM](state, updatedItem: CartItem) {
      const itemIndex = state.cart.findIndex((item) => {
        return item.address === updatedItem.address
      })
      if (itemIndex > -1) {
        Vue.set(state.cart, itemIndex, updatedItem)
      }
    },
    [REMOVE_CART_ITEM](state, removedItem: CartItem) {
      const itemIndex = state.cart.findIndex((item) => {
        return item.address === removedItem.address
      })
      if (itemIndex > -1) {
        state.cart.splice(itemIndex, 1)
      }
    },
  },
  actions: {
    async [LOAD_ROUND_INFO]({ commit }) {
      const currentRound = await getRoundInfo()
      commit(SET_CURRENT_ROUND, currentRound)
      if (currentRound && currentRound.status === RoundStatus.Finalized) {
        const tally = await getTally(currentRound.fundingRoundAddress)
        commit(SET_TALLY, tally)
      }
    },
    async [CHECK_VERIFICATION]({ commit, state }) {
      if (state.currentRound && state.currentUser) {
        const isVerified = await isVerifiedUser(
          state.currentRound.fundingRoundAddress,
          state.currentUser.walletAddress,
        )
        commit(SET_CURRENT_USER, { ...state.currentUser, isVerified })
      }
    },
  },
  modules: {},
}

export default new Vuex.Store(store)
