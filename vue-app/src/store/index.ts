// Libraries
import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'

// API
import { CartItem } from '@/api/contributions'

// Actions
import actions from './actions'

// Getters
import getters, { RootState } from './getters'

// Mutations
import mutations from './mutations'

Vue.use(Vuex)

const state: RootState = {
  cart: new Array<CartItem>(),
  cartEditModeSelected: false,
  committedCart: new Array<CartItem>(),
  contribution: null,
  contributor: null,
  hasVoted: false,
  currentRound: null,
  currentRoundAddress: null,
  currentUser: null,
  recipient: null,
  recipientRegistryAddress: null,
  recipientRegistryInfo: null,
  showCartPanel: false,
  tally: null,
}

const store: StoreOptions<RootState> = {
  state,
  mutations,
  actions,
  getters,
  modules: {},
}

export default new Vuex.Store(store)
