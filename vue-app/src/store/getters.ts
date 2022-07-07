// Libraries
import { BigNumber } from 'ethers'
import { DateTime } from 'luxon'

// API
import { CartItem, Contributor } from '@/api/contributions'
import { recipientRegistryType } from '@/api/core'
import { RoundInfo, RoundStatus } from '@/api/round'
import { Tally } from '@/api/tally'
import { User } from '@/api/user'
import { Factory } from '@/api/factory'
import { MACIFactory } from '@/api/maci-factory'
import {
  RecipientApplicationData,
  RegistryInfo,
} from '@/api/recipient-registry-optimistic'

// Utils
import { isSameAddress } from '@/utils/accounts'
import { getSecondsFromNow, hasDateElapsed } from '@/utils/dates'

export interface RootState {
  cart: CartItem[]
  cartEditModeSelected: boolean
  committedCart: CartItem[]
  contribution: BigNumber | null
  contributor: Contributor | null
  hasVoted: boolean
  currentRound: RoundInfo | null
  currentRoundAddress: string | null
  currentUser: User | null
  recipient: RecipientApplicationData | null
  recipientRegistryAddress: string | null
  recipientRegistryInfo: RegistryInfo | null
  showCartPanel: boolean
  tally: Tally | null
  factory: Factory | null
  maciFactory: MACIFactory | null
}

const getters = {
  recipientJoinDeadline: (state: RootState): DateTime | null => {
    if (!state.currentRound || !state.recipientRegistryInfo) {
      return null
    }

    const challengePeriodDuration =
      recipientRegistryType === 'optimistic'
        ? state.recipientRegistryInfo.challengePeriodDuration
        : 0

    const deadline = state.currentRound.signUpDeadline.minus({
      seconds: challengePeriodDuration,
    })

    return deadline.isValid ? deadline : null
  },
  isRoundJoinPhase: (state: RootState, getters): boolean => {
    return !hasDateElapsed(getters.recipientJoinDeadline)
  },
  isRoundJoinOnlyPhase: (state: RootState, getters): boolean => {
    return (
      !!state.currentRound &&
      getters.isRoundJoinPhase &&
      !hasDateElapsed(state.currentRound.startTime)
    )
  },
  recipientSpacesRemaining: (state: RootState): number | null => {
    if (!state.currentRound || !state.recipientRegistryInfo) {
      return null
    }
    const maxRecipients = state.currentRound.maxRecipients
    const recipientCount = state.recipientRegistryInfo.recipientCount
    return maxRecipients - recipientCount
  },
  isRecipientRegistryFull: (_, getters): boolean => {
    return getters.recipientSpacesRemaining === 0
  },
  isRecipientRegistryFillingUp: (_, getters): boolean => {
    return (
      getters.recipientSpacesRemaining !== null &&
      getters.recipientSpacesRemaining < 20
    )
  },
  isRoundBufferPhase: (state: RootState, getters): boolean => {
    return (
      !!state.currentRound &&
      !getters.isJoinPhase &&
      !hasDateElapsed(state.currentRound.signUpDeadline)
    )
  },
  isRoundContributionPhase: (state: RootState): boolean => {
    return (
      !!state.currentRound &&
      state.currentRound.status === RoundStatus.Contributing
    )
  },
  isRoundContributionPhaseEnding: (state: RootState, getters): boolean => {
    return (
      !!state.currentRound &&
      getters.isRoundContributionPhase &&
      getSecondsFromNow(state.currentRound.signUpDeadline) < 24 * 60 * 60
    )
  },
  isRoundReallocationPhase: (state: RootState): boolean => {
    return (
      !!state.currentRound &&
      state.currentRound.status === RoundStatus.Reallocating
    )
  },
  isRoundTallying: (state: RootState): boolean => {
    return (
      !!state.currentRound && state.currentRound.status === RoundStatus.Tallying
    )
  },
  isRoundFinalized: (state: RootState): boolean => {
    return (
      !!state.currentRound &&
      state.currentRound.status === RoundStatus.Finalized
    )
  },
  hasContributionPhaseEnded: (state: RootState, getters): boolean => {
    return (
      !!state.currentRound &&
      (hasDateElapsed(state.currentRound.signUpDeadline) ||
        getters.isRoundContributorLimitReached ||
        getters.isMessageLimitReached)
    )
  },
  hasReallocationPhaseEnded: (state: RootState, getters): boolean => {
    return (
      !!state.currentRound &&
      (hasDateElapsed(state.currentRound.votingDeadline) ||
        getters.isMessageLimitReached)
    )
  },
  hasUserContributed: (state: RootState): boolean => {
    return (
      !!state.currentUser &&
      !!state.contribution &&
      !state.contribution.isZero()
    )
  },
  hasUserVoted: (state: RootState): boolean => {
    return state.hasVoted
  },
  canUserReallocate: (_, getters): boolean => {
    return (
      getters.hasUserContributed &&
      (getters.isRoundContributionPhase || getters.isRoundReallocationPhase)
    )
  },
  isRecipientRegistryOwner: (state: RootState): boolean => {
    if (!state.currentUser || !state.recipientRegistryInfo) {
      return false
    }
    return isSameAddress(
      state.currentUser.walletAddress,
      state.recipientRegistryInfo.owner
    )
  },
  isMessageLimitReached: (state: RootState): boolean => {
    return (
      !!state.currentRound &&
      state.currentRound.maxMessages <= state.currentRound.messages
    )
  },
  isRoundContributorLimitReached: (state: RootState): boolean => {
    return (
      !!state.currentRound &&
      state.currentRound.maxContributors <= state.currentRound.contributors
    )
  },
  nativeTokenAddress: (state: RootState): string => {
    const { currentRound, factory } = state

    let nativeTokenAddress = ''

    if (factory) {
      nativeTokenAddress = factory.nativeTokenAddress
    }

    if (currentRound) {
      nativeTokenAddress = currentRound.nativeTokenAddress
    }

    return nativeTokenAddress
  },
  nativeTokenSymbol: (state: RootState): string => {
    const { currentRound, factory } = state

    let nativeTokenSymbol = ''

    if (factory) {
      nativeTokenSymbol = factory.nativeTokenSymbol
    }

    if (currentRound) {
      nativeTokenSymbol = currentRound.nativeTokenSymbol
    }

    return nativeTokenSymbol
  },
  nativeTokenDecimals: (state: RootState): number | undefined => {
    const { currentRound, factory } = state

    let nativeTokenDecimals

    if (factory) {
      nativeTokenDecimals = factory.nativeTokenDecimals
    }

    if (currentRound) {
      nativeTokenDecimals = currentRound.nativeTokenDecimals
    }

    return nativeTokenDecimals
  },
  maxRecipients: (state: RootState): number | undefined => {
    const { currentRound, maciFactory } = state

    if (currentRound) {
      return currentRound.maxRecipients
    }

    if (maciFactory) {
      return maciFactory.maxRecipients
    }
  },
  userRegistryAddress: (state: RootState): string | undefined => {
    const { currentRound, factory } = state

    if (currentRound) {
      return currentRound.userRegistryAddress
    }

    if (factory) {
      return factory.userRegistryAddress
    }
  },
}

export default getters
