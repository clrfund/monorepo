import { BigNumber, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'
import { PubKey } from '@clrfund/maci-utils'

import { factory } from './core'
import { Rounds } from './rounds'

import { Project } from './projects'
import sdk from '@/graphql/sdk'

export interface RoundInfo {
  fundingRoundAddress: string
  userRegistryAddress: string
  recipientRegistryAddress: string
  maciAddress: string
  recipientTreeDepth: number
  maxContributors: number
  maxRecipients: number
  maxMessages: number
  coordinatorPubKey: PubKey
  nativeTokenAddress: string
  nativeTokenSymbol: string
  nativeTokenDecimals: number
  voiceCreditFactor: BigNumber
  status: string
  startTime: DateTime
  signUpDeadline: DateTime
  votingDeadline: DateTime
  totalFunds: FixedNumber
  matchingPool: FixedNumber
  contributions: FixedNumber
  contributors: number
  messages: number
  projects?: Project[]
}

export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export enum RoundStatus {
  Contributing = 'Contributing',
  Reallocating = 'Reallocating',
  Tallying = 'Tallying',
  Finalized = 'Finalized',
  Cancelled = 'Cancelled',
}
//TODO: update to take factory address as a parameter, default to env. variable
export async function getCurrentRound(): Promise<string | null> {
  const fundingRoundFactoryAddress = factory.address.toLowerCase()
  const data = await sdk.GetCurrentRound({
    fundingRoundFactoryAddress,
  })

  if (!data) {
    return null
  }

  if (!data.fundingRoundFactory?.currentRound?.id) {
    return null
  }

  const fundingRoundAddress = data.fundingRoundFactory?.currentRound?.id
  const rounds = await Rounds.create()
  const index = rounds.getRoundIndex(fundingRoundAddress)

  if (
    index !== undefined &&
    index >= Number(process.env.VUE_APP_FIRST_ROUND || 0)
  ) {
    return fundingRoundAddress
  }
  return null
}
