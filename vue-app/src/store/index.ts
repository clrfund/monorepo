import Vue from 'vue'
import Vuex from 'vuex'

import { SET_ACCOUNT } from './mutation-types'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    account: '',
  },
  mutations: {
    [SET_ACCOUNT](state, account: string) {
      state.account = account
    },
  },
  actions: {},
  modules: {},
})
