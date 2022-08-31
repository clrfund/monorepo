// Libraries
import { BigNumber } from 'ethers'
import { DateTime } from 'luxon'

// API
import { CartItem, Contributor } from '@/api/contributions'
import { operator } from '@/api/core'
import { RoundInfo, RoundStatus } from '@/api/round'
import { Tally } from '@/api/tally'
import { User } from '@/api/user'
import { Factory } from '@/api/factory'
import { MACIFactory } from '@/api/maci-factory'
import { RegistryInfo } from '@/api/types'
import { RecipientApplicationData } from '@/api/recipient'

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
  theme: string | null
  factory: Factory | null
  maciFactory: MACIFactory | null
}

const getters = {
  recipientJoinDeadline: (state: RootState): DateTime | null => {
    if (!state.currentRound || !state.recipientRegistryInfo) {
      return null
    }

    const challengePeriodDuration =
      state.recipientRegistryInfo.challengePeriodDuration

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
  isRoundCancelled:
    (state: RootState) =>
    (roundInfo?: RoundInfo): boolean => {
      const round = roundInfo || state.currentRound
      return !!round && round.status === RoundStatus.Cancelled
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
    if (
      !state.currentUser ||
      !state.recipientRegistryInfo ||
      !state.recipientRegistryInfo.owner
    ) {
      // return false if no owner or logged in user information
      // e.g. the kleros recipient registry does not have a owner
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
  isSelfRegistration: (state: RootState): boolean => {
    return !!state.recipientRegistryInfo?.isSelfRegistration
  },
  requireRegistrationDeposit: (state: RootState): boolean => {
    return !!state.recipientRegistryInfo?.requireRegistrationDeposit
  },
  canAddProject: (_, getters): boolean => {
    const {
      requireRegistrationDeposit,
      isRecipientRegistryOwner,
      isRecipientRegistryFull,
      isRoundJoinPhase,
    } = getters

    return (
      (requireRegistrationDeposit || isRecipientRegistryOwner) &&
      !isRecipientRegistryFull &&
      isRoundJoinPhase
    )
  },
  joinFormUrl:
    () =>
    (metadataId?: string): string => {
      return metadataId ? `/join/metadata/${metadataId}` : '/join/project'
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
  isCurrentRound:
    (state: RootState) =>
    (roundAddress: string): boolean => {
      const currentRoundAddress = state.currentRoundAddress || ''
      return isSameAddress(roundAddress, currentRoundAddress)
    },
  operator: (): string => {
    return operator
  },
}

export default getters
