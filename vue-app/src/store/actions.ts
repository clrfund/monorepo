// Libraries
import Vue from 'vue'

// API
import {
  getCartStorageKey,
  getCommittedCartStorageKey,
  serializeCart,
  deserializeCart,
  getContributionAmount,
  hasContributorVoted,
  getContributorIndex,
  Contributor,
} from '@/api/contributions'
import { RoundStatus } from '@/api/round'
import { Rounds } from '@/api/rounds'
import { storage } from '@/api/storage'
import { getTally } from '@/api/tally'
import {
  getEtherBalance,
  getTokenBalance,
  isVerifiedUser,
  LOGIN_MESSAGE,
} from '@/api/user'
import { getRegistryInfo } from '@/api/recipient-registry-optimistic'

// Constants
import {
  LOAD_BRIGHT_ID,
  LOAD_CART,
  LOAD_COMMITTED_CART,
  LOAD_CONTRIBUTOR_DATA,
  LOAD_FACTORY_INFO,
  LOAD_MACI_FACTORY_INFO,
  LOAD_RECIPIENT_REGISTRY_INFO,
  LOAD_ROUND_INFO,
  LOAD_ROUNDS,
  LOAD_TALLY,
  LOAD_USER_INFO,
  REQUEST_USER_SIGNATURE,
  LOGOUT_USER,
  SAVE_CART,
  SAVE_COMMITTED_CART_DISPATCH,
  SELECT_ROUND,
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
  SET_ROUNDS,
  SET_TALLY,
  SET_CURRENT_USER,
  SET_RECIPIENT_REGISTRY_ADDRESS,
  SET_RECIPIENT_REGISTRY_INFO,
  SET_HAS_VOTED,
  SET_FACTORY,
  SET_MACI_FACTORY,
  SET_CART_LOADED,
} from './mutation-types'

// Utils
import { ensLookup } from '@/utils/accounts'
import { factory, UserRegistryType, userRegistryType } from '@/api/core'
import { BrightId, getBrightId } from '@/api/bright-id'
import { getFactoryInfo } from '@/api/factory'
import { getMACIFactoryInfo } from '@/api/maci-factory'
import { getCommittedCart } from '@/api/cart'
import { Keypair } from '@clrfund/maci-utils'
import { sha256 } from '@/utils/crypto'

const actions = {
  //TODO: also commit SET_CURRENT_FACTORY_ADDRESS on this action, should be passed optionally and default to env variable
  [SELECT_ROUND]({ commit, state }, roundAddress: string) {
    if (state.currentRoundAddress) {
      // Reset everything that depends on round
      commit(SET_CONTRIBUTION, null)
      commit(SET_CONTRIBUTOR, null)
      commit(CLEAR_CART)
      commit(SET_CART_LOADED, false)
      commit(SET_RECIPIENT_REGISTRY_ADDRESS, null)
      commit(SET_RECIPIENT_REGISTRY_INFO, null)
      commit(SET_CURRENT_ROUND, null)
    }
    commit(SET_CURRENT_ROUND_ADDRESS, roundAddress)
  },
  async [LOAD_FACTORY_INFO]({ commit }) {
    const factory = await getFactoryInfo()
    commit(SET_FACTORY, factory)
  },
  async [LOAD_MACI_FACTORY_INFO]({ commit }) {
    const factory = await getMACIFactoryInfo()
    commit(SET_MACI_FACTORY, factory)
  },
  async [LOAD_ROUNDS]({ commit }) {
    const rounds = await Rounds.create()
    commit(SET_ROUNDS, rounds)
  },
  async [LOAD_ROUND_INFO]({ commit, state }) {
    const roundAddress = state.currentRoundAddress
    if (roundAddress === null) {
      commit(SET_CURRENT_ROUND, null)
      return
    }

    let rounds = state.rounds
    if (rounds === null) {
      rounds = await Rounds.create()
      commit(SET_ROUNDS, rounds)
    }

    const round = await rounds.getRound(roundAddress)
    if (round) {
      const roundInfo = await round.getRoundInfo()
      commit(SET_CURRENT_ROUND, roundInfo)
    } else {
      commit(SET_CURRENT_ROUND, null)
    }
  },
  async [LOAD_TALLY]({ commit, state }) {
    const currentRound = state.currentRound
    if (currentRound && currentRound.status === RoundStatus.Finalized) {
      const tally = await getTally(state.currentRoundAddress)
      commit(SET_TALLY, tally)
    }
  },
  async [LOAD_RECIPIENT_REGISTRY_INFO]({ commit }) {
    const info = await getRegistryInfo(factory.address)
    if (!info) {
      commit(SET_RECIPIENT_REGISTRY_ADDRESS, null)
      return
    }

    const recipientRegistryAddress = info.registryAddress
    commit(SET_RECIPIENT_REGISTRY_ADDRESS, recipientRegistryAddress)
    commit(SET_RECIPIENT_REGISTRY_INFO, info)
  },
  async [LOAD_USER_INFO]({ commit, state }) {
    if (!state.currentUser || !state.factory) {
      return
    }

    let nativeTokenAddress, userRegistryAddress, balance

    if (state.factory) {
      nativeTokenAddress = state.factory.nativeTokenAddress
      userRegistryAddress = state.factory.userRegistryAddress
    }

    if (state.currentRound) {
      nativeTokenAddress = state.currentRound.nativeTokenAddress
      userRegistryAddress = state.currentRound.userRegistryAddress

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
    }

    // Check if this user is in our user registry
    const isRegistered = userRegistryAddress
      ? await isVerifiedUser(
          userRegistryAddress,
          state.currentUser.walletAddress
        )
      : false

    if (nativeTokenAddress) {
      balance = await getTokenBalance(
        nativeTokenAddress,
        state.currentUser.walletAddress
      )
    }

    const etherBalance = await getEtherBalance(state.currentUser.walletAddress)
    let ensName: string | null = state.currentUser.ensName
    ensName = await ensLookup(state.currentUser.walletAddress)

    commit(SET_CURRENT_USER, {
      ...state.currentUser,
      isRegistered,
      balance,
      etherBalance,
      ensName,
    })
  },
  async [REQUEST_USER_SIGNATURE]({ commit, state }) {
    if (!state.currentUser) {
      throw new Error('Not connected to wallet')
    }

    if (state.currentUser.encryptionKey) {
      // skip if we already have the encryption key
      return
    }

    const signer = state.currentUser.walletProvider.getSigner()
    const signature = await signer.signMessage(LOGIN_MESSAGE)
    const encryptionKey = sha256(signature)
    commit(SET_CURRENT_USER, {
      ...state.currentUser,
      encryptionKey,
    })
  },
  async [LOAD_BRIGHT_ID]({ commit, state }) {
    if (state.currentUser && userRegistryType === UserRegistryType.BRIGHT_ID) {
      // If the user is registered, we assume all brightId steps as done
      let brightId: BrightId = {
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
  async [LOAD_CART]({ commit, state }) {
    const data = await storage.getItem(
      state.currentUser.walletAddress,
      state.currentUser.encryptionKey,
      getCartStorageKey(state.currentRound.fundingRoundAddress)
    )

    const cart = deserializeCart(data)
    commit(CLEAR_CART)
    for (const item of cart) {
      commit(ADD_CART_ITEM, item)
    }
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
  async [LOAD_COMMITTED_CART]({ commit, state }) {
    if (!state.currentUser.walletAddress || !state.currentUser.encryptionKey) {
      return
    }

    const committedCart = await getCommittedCart(
      state.currentRound,
      state.currentUser.encryptionKey,
      state.currentUser.walletAddress
    )

    Vue.set(state, 'committedCart', committedCart)
    if (committedCart.length > 0) {
      // only overwrite the uncommitted cart if there's committed cart
      commit(RESTORE_COMMITTED_CART_TO_LOCAL_CART)
    }
  },
  async [LOAD_CONTRIBUTOR_DATA]({ commit, state }) {
    const { fundingRoundAddress } = state.currentRound
    const { encryptionKey } = state.currentUser
    if (!encryptionKey || !fundingRoundAddress) {
      return
    }

    const contributorKeypair = Keypair.createFromSeed(
      state.currentUser.encryptionKey
    )

    const stateIndex = await getContributorIndex(
      fundingRoundAddress,
      contributorKeypair.pubKey
    )

    if (!stateIndex) {
      // if no contributor index, user has not contributed
      return
    }

    const contributor: Contributor = {
      keypair: contributorKeypair,
      stateIndex,
    }
    commit(SET_CONTRIBUTOR, contributor)
  },
  [LOGOUT_USER]({ commit }) {
    commit(SET_CURRENT_USER, null)
    commit(SET_CONTRIBUTION, null)
    commit(SET_CONTRIBUTOR, null)
    commit(CLEAR_CART)
    commit(SET_CART_LOADED, false)
  },
}

export default actions
