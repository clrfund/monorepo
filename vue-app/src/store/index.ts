import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'

import { RoundInfo } from '@/api/round'
import { SET_ACCOUNT, SET_CURRENT_ROUND } from './mutation-types'

Vue.use(Vuex)

interface RootState {
  account: string;
  currentRound: RoundInfo | null;
}

const store: StoreOptions<RootState> = {
  state: {
    account: '',
    currentRound: null,
  },
  mutations: {
    [SET_ACCOUNT](state, account: string) {
      state.account = account
    },
    [SET_CURRENT_ROUND](state, round: RoundInfo) {
      state.currentRound = round
    },
  },
  actions: {},
  modules: {},
}

export default new Vuex.Store(store)
