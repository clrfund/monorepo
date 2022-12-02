import { BigNumber, Contract, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'
import { PubKey } from 'maci-domainobjs'

import { factory, provider } from './core'
import { Rounds } from './rounds'

import { Project } from './projects'

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
  const fundingRoundAddress = await factory.getCurrentRound()
  if (fundingRoundAddress === '0x0000000000000000000000000000000000000000') {
    return null
  }

  const rounds = await Rounds.create()
  const index = rounds.getRoundIndex(fundingRoundAddress)

  if (index && index >= Number(process.env.VUE_APP_FIRST_ROUND || 0)) {
    return fundingRoundAddress
  }
  return null
}
