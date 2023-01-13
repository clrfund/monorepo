import { Contract } from 'ethers'
import { provider } from './core'
import { MACI } from './abi'
import { DateTime } from 'luxon'
import { PubKey } from 'maci-domainobjs'

export type Maci = {
  maciAddress: string
  startTime: DateTime
  signUpDeadline: DateTime
  votingDeadline: DateTime
  coordinatorPubKey: PubKey
  maxContributors: number
  maxRecipients: number
  maxMessages: number
  messages: number
  recipientTreeDepth: number
}

export async function getMaciInfo(maciAddress: string): Promise<Maci | null> {
  const maci = new Contract(maciAddress, MACI, provider)
  const [
    maciTreeDepths,
    signUpTimestamp,
    signUpDurationSeconds,
    votingDurationSeconds,
    coordinatorPubKeyRaw,
    messages,
  ] = await Promise.all([
    maci.treeDepths(),
    maci.signUpTimestamp(),
    maci.signUpDurationSeconds(),
    maci.votingDurationSeconds(),
    maci.coordinatorPubKey(),
    maci.numMessages(),
  ])
  const startTime = DateTime.fromSeconds(signUpTimestamp.toNumber())
  const signUpDeadline = DateTime.fromSeconds(
    signUpTimestamp.add(signUpDurationSeconds).toNumber()
  )
  const votingDeadline = DateTime.fromSeconds(
    signUpTimestamp
      .add(signUpDurationSeconds)
      .add(votingDurationSeconds)
      .toNumber()
  )
  const coordinatorPubKey = new PubKey([
    BigInt(coordinatorPubKeyRaw.x),
    BigInt(coordinatorPubKeyRaw.y),
  ])

  const maxContributors = 2 ** maciTreeDepths.stateTreeDepth - 1
  const maxMessages = 2 ** maciTreeDepths.messageTreeDepth - 1
  const maxRecipients = 5 ** maciTreeDepths.voteOptionTreeDepth - 1
  const recipientTreeDepth = maciTreeDepths.voteOptionTreeDepth
  return {
    maciAddress,
    startTime,
    signUpDeadline,
    votingDeadline,
    coordinatorPubKey,
    maxContributors,
    maxRecipients,
    maxMessages,
    messages,
    recipientTreeDepth,
  }
}
