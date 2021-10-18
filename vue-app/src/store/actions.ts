// Libraries
import Vue from 'vue'

// API
import {
  getCartStorageKey,
  getCommittedCartStorageKey,
  serializeCart,
  deserializeCart,
  getContributorStorageKey,
  serializeContributorData,
  deserializeContributorData,
  getContributionAmount,
  hasContributorVoted,
} from '@/api/contributions'
import { loginUser, logoutUser } from '@/api/gun'
import { getRecipientRegistryAddress } from '@/api/projects'
import { RoundStatus, getRoundInfo } from '@/api/round'
import { storage } from '@/api/storage'
import { getTally } from '@/api/tally'
import { getEtherBalance, getTokenBalance, isVerifiedUser } from '@/api/user'
import { getRegistryInfo } from '@/api/recipient-registry-optimistic'

// Constants
import {
  LOAD_BRIGHT_ID,
  LOAD_CART,
  LOAD_COMMITTED_CART,
  LOAD_CONTRIBUTOR_DATA,
  LOAD_RECIPIENT_REGISTRY_INFO,
  LOAD_ROUND_INFO,
  LOAD_USER_INFO,
  LOGIN_USER,
  LOGOUT_USER,
  SAVE_CART,
  SAVE_COMMITTED_CART_DISPATCH,
  SAVE_CONTRIBUTOR_DATA,
  SELECT_ROUND,
  UNWATCH_CART,
  UNWATCH_CONTRIBUTOR_DATA,
} from './action-types'
import {
  ADD_CART_ITEM,
  CLEAR_CART,
  RESTORE_COMMITTED_CART_TO_LOCAL_CART,
  SAVE_COMMITTED_CART,
  SET_CONTRIBUTION,
  SET_CONTRIBUTOR,
  SET_CURRENT_ROUND,
  SET_CURRENT_ROUND_ADDRESS,
  SET_TALLY,
  SET_CURRENT_USER,
  SET_RECIPIENT_REGISTRY_ADDRESS,
  SET_RECIPIENT_REGISTRY_INFO,
  SET_HAS_VOTED,
} from './mutation-types'

// Utils
import { ensLookup } from '@/utils/accounts'
import { UserRegistryType, userRegistryType } from '@/api/core'
import { BrightId, getBrightId } from '@/api/bright-id'

const actions = {
  //TODO: also commit SET_CURRENT_FACTORY_ADDRESS on this action, should be passed optionally and default to env variable
  [SELECT_ROUND]({ commit, dispatch, state }, roundAddress: string) {
    if (state.currentRoundAddress) {
      // Reset everything that depends on round
      dispatch(UNWATCH_CART)
      dispatch(UNWATCH_CONTRIBUTOR_DATA)
      commit(SET_CONTRIBUTION, null)
      commit(SET_CONTRIBUTOR, null)
      commit(CLEAR_CART)
      commit(SET_RECIPIENT_REGISTRY_ADDRESS, null)
      commit(SET_RECIPIENT_REGISTRY_INFO, null)
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
    //TODO: update to take factory address as a parameter, default to env. variable
    const round = await getRoundInfo(roundAddress)
    commit(SET_CURRENT_ROUND, round)
    if (round && round.status === RoundStatus.Finalized) {
      const tally = await getTally(roundAddress)
      commit(SET_TALLY, tally)
    }
  },
  async [LOAD_RECIPIENT_REGISTRY_INFO]({ commit, state }) {
    //TODO: update call to getRecipientRegistryAddress to take factory address as a parameter
    const recipientRegistryAddress =
      state.recipientRegistryAddress ||
      (await getRecipientRegistryAddress(state.currentRoundAddress))
    commit(SET_RECIPIENT_REGISTRY_ADDRESS, recipientRegistryAddress)

    if (recipientRegistryAddress) {
      const info = await getRegistryInfo(recipientRegistryAddress)
      commit(SET_RECIPIENT_REGISTRY_INFO, info)
    } else {
      commit(SET_RECIPIENT_REGISTRY_INFO, null)
    }
  },
  async [LOAD_USER_INFO]({ commit, state }) {
    if (state.currentRound && state.currentUser) {
      // Check if this user is in our user registry
      const isRegistered = await isVerifiedUser(
        state.currentRound.userRegistryAddress,
        state.currentUser.walletAddress
      )

      const etherBalance = await getEtherBalance(
        state.currentUser.walletAddress
      )
      const balance = await getTokenBalance(
        state.currentRound.nativeTokenAddress,
        state.currentUser.walletAddress
      )
      let contribution = state.contribution
      if (!contribution || contribution.isZero()) {
        contribution = await getContributionAmount(
          state.currentRound.fundingRoundAddress,
          state.currentUser.walletAddress
        )

        const hasVoted = await hasContributorVoted(
          state.currentRound.fundingRoundAddress,
          state.currentUser.walletAddress
        )

        commit(SET_CONTRIBUTION, contribution)
        commit(SET_HAS_VOTED, hasVoted)
      }

      let ensName: string | null = state.currentUser.ensName
      ensName = await ensLookup(state.currentUser.walletAddress)

      commit(SET_CURRENT_USER, {
        ...state.currentUser,
        isRegistered,
        balance,
        etherBalance,
        ensName,
      })
    }
  },
  async [LOAD_BRIGHT_ID]({ commit, state }) {
    if (state.currentUser && userRegistryType === UserRegistryType.BRIGHT_ID) {
      // If the user is registered, we assume all brightId steps as done
      let brightId: BrightId = {
        isLinked: true,
        isSponsored: true,
        isVerified: true,
      }

      if (!state.currentUser.isRegistered) {
        // If not registered, then fetch brightId data
        brightId = await getBrightId(state.currentUser.walletAddress)
      }

      commit(SET_CURRENT_USER, {
        ...state.currentUser,
        brightId,
      })
    }
  },
  [SAVE_CART]({ state }) {
    const serializedCart = serializeCart(state.cart)
    storage.setItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getCartStorageKey(state.currentRound.fundingRoundAddress),
      serializedCart
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
      }
    )
  },
  [UNWATCH_CART]({ state }) {
    if (!state.currentUser || !state.currentRound) {
      return
    }
    storage.unwatchItem(
      state.currentUser.walletAddress,
      getCartStorageKey(state.currentRound.fundingRoundAddress)
    )
  },
  [SAVE_COMMITTED_CART_DISPATCH]({ commit, state }) {
    commit(SAVE_COMMITTED_CART)
    const serializedCart = serializeCart(state.committedCart)
    storage.setItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getCommittedCartStorageKey(state.currentRound.fundingRoundAddress),
      serializedCart
    )
  },
  [LOAD_COMMITTED_CART]({ commit, state }) {
    storage.watchItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getCommittedCartStorageKey(state.currentRound.fundingRoundAddress),
      (data: string | null) => {
        const committedCart = deserializeCart(data)
        Vue.set(state, 'committedCart', committedCart)
        commit(RESTORE_COMMITTED_CART_TO_LOCAL_CART)
      }
    )
  },
  [SAVE_CONTRIBUTOR_DATA]({ state }) {
    const serializedData = serializeContributorData(state.contributor)
    storage.setItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getContributorStorageKey(state.currentRound.fundingRoundAddress),
      serializedData
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
      }
    )
  },
  [UNWATCH_CONTRIBUTOR_DATA]({ state }) {
    if (!state.currentUser || !state.currentRound) {
      return
    }
    storage.unwatchItem(
      state.currentUser.walletAddress,
      getContributorStorageKey(state.currentRound.fundingRoundAddress)
    )
  },
  async [LOGIN_USER]({ state, dispatch }) {
    await loginUser(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey
    )
    dispatch(LOAD_BRIGHT_ID)
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

export default actions
