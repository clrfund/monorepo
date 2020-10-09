import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import { FixedNumber } from 'ethers'

import { CartItem } from '@/api/contributions'
import { RoundInfo, RoundStatus, getRoundInfo } from '@/api/round'
import { Tally, getTally } from '@/api/tally'
import { User } from '@/api/user'
import { LOAD_ROUND_INFO } from './action-types'
import {
  SET_CURRENT_USER,
  SET_CURRENT_ROUND,
  SET_TALLY,
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
  contribution: FixedNumber;
}

const store: StoreOptions<RootState> = {
  state: {
    currentUser: null,
    currentRound: null,
    tally: null,
    cart: new Array<CartItem>(),
    contribution: FixedNumber.from(0),
  },
  mutations: {
    [SET_CURRENT_USER](state, user: User) {
      state.currentUser = user
    },
    [SET_CURRENT_ROUND](state, round: RoundInfo) {
      state.currentRound = round
    },
    [SET_TALLY](state, tally: Tally) {
      state.tally = tally
    },
    [SET_CONTRIBUTION](state, contribution: FixedNumber) {
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
  },
  modules: {},
}

export default new Vuex.Store(store)
