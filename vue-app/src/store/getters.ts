// Libraries
import { BigNumber } from 'ethers'
import { DateTime } from 'luxon'

// API
import { CartItem, Contributor } from '@/api/contributions'
import { recipientRegistryType } from '@/api/core'
import { RoundInfo, RoundStatus } from '@/api/round'
import { Tally } from '@/api/tally'
import { User } from '@/api/user'
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

    return state.currentRound.signUpDeadline.minus({
      seconds: challengePeriodDuration,
    })
  },
  isRoundJoinPhase: (state: RootState, getters): boolean => {
    if (!state.currentRound) {
      return true
    }
    if (!state.recipientRegistryInfo) {
      return false
    }
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
}

export default getters
