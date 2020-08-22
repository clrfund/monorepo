import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import { Web3Provider } from '@ethersproject/providers'

import { CartItem } from '@/api/contributions'
import { RoundInfo } from '@/api/round'
import {
  SET_WALLET_PROVIDER,
  SET_ACCOUNT,
  SET_CURRENT_ROUND,
  ADD_CART_ITEM,
  UPDATE_CART_ITEM,
  REMOVE_CART_ITEM,
} from './mutation-types'

Vue.use(Vuex)

interface RootState {
  walletProvider: Web3Provider | null;
  account: string;
  currentRound: RoundInfo | null;
  cart: CartItem[];
}

const store: StoreOptions<RootState> = {
  state: {
    walletProvider: null,
    account: '',
    currentRound: null,
    cart: new Array<CartItem>(),
  },
  mutations: {
    [SET_WALLET_PROVIDER](state, provider: Web3Provider) {
      state.walletProvider = provider
    },
    [SET_ACCOUNT](state, account: string) {
      state.account = account
    },
    [SET_CURRENT_ROUND](state, round: RoundInfo) {
      state.currentRound = round
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
  actions: {},
  modules: {},
}

export default new Vuex.Store(store)
