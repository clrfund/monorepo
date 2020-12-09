import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import { BigNumber } from 'ethers'

import { CartItem, Contributor, getContributionAmount } from '@/api/contributions'
import { RoundInfo, RoundStatus, getCurrentRound, getRoundInfo } from '@/api/round'
import { Tally, getTally } from '@/api/tally'
import { User, isVerifiedUser, getTokenBalance } from '@/api/user'
import {
  LOAD_ROUND_INFO,
  LOAD_USER_INFO,
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
  contribution: BigNumber | null;
}

const store: StoreOptions<RootState> = {
  state: {
    currentUser: null,
    currentRound: null,
    tally: null,
    cart: new Array<CartItem>(),
    contributor: null,
    contribution: null,
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
    [SET_CONTRIBUTION](state, contribution: BigNumber | null) {
      state.contribution = contribution
    },
    [ADD_CART_ITEM](state, addedItem: CartItem) {
      const exists = state.cart.find((item) => {
        return item.id === addedItem.id
      })
      if (!exists) {
        state.cart.push(addedItem)
      }
    },
    [UPDATE_CART_ITEM](state, updatedItem: CartItem) {
      const itemIndex = state.cart.findIndex((item) => {
        return item.id === updatedItem.id
      })
      if (itemIndex > -1) {
        Vue.set(state.cart, itemIndex, updatedItem)
      }
    },
    [REMOVE_CART_ITEM](state, removedItem: CartItem) {
      const itemIndex = state.cart.findIndex((item) => {
        return item.id === removedItem.id
      })
      if (itemIndex > -1) {
        state.cart.splice(itemIndex, 1)
      }
    },
  },
  actions: {
    async [LOAD_ROUND_INFO]({ commit }, roundAddress: string | null = null) {
      if (roundAddress === null) {
        roundAddress = await getCurrentRound()
      }
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
  },
  modules: {},
}

export default new Vuex.Store(store)
