// Libraries
import Vue from 'vue'
import { BigNumber } from 'ethers'

// API
import { MAX_CART_SIZE, CartItem, Contributor } from '@/api/contributions'
import { RoundInfo } from '@/api/round'
import { Tally } from '@/api/tally'
import { User } from '@/api/user'
import { Factory } from '@/api/factory'
import {
  RecipientApplicationData,
  RegistryInfo,
} from '@/api/recipient-registry-optimistic'

// Constants
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
  SET_HAS_VOTED,
  TOGGLE_THEME,
  SET_FACTORY,
} from './mutation-types'
import { ThemeMode } from '@/api/core'

const mutations = {
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
  [SET_FACTORY](state, factory: Factory) {
    state.factory = factory
  },
  //TODO: also dispatch SET_CURRENT_FACTORY_ADDRESS mutation when ever this fires
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
  [SET_HAS_VOTED](state, hasVoted: boolean) {
    state.hasVoted = hasVoted
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
  [TOGGLE_THEME](state, theme: string | undefined) {
    if (theme) {
      state.theme = theme
    } else {
      state.theme =
        state.theme === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT
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

export default mutations
