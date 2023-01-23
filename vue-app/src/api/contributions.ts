import { BigNumber, Contract, Signer, FixedNumber } from 'ethers'
import { parseFixed } from '@ethersproject/bignumber'

import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Keypair, PrivKey, PubKey, Message, Command } from '@clrfund/maci-utils'

import { RoundInfo } from './round'
import { FundingRound } from './abi'
import { Project } from './projects'
import sdk from '@/graphql/sdk'
import { getPubKeyId } from './keypair'
import { Transaction } from '@/utils/transaction'

export const DEFAULT_CONTRIBUTION_AMOUNT = 5
export const MAX_CONTRIBUTION_AMOUNT = 10000 // See FundingRound.sol

// The batch of maximum size will burn 9100000 gas at 700000 gas per message
export const MAX_CART_SIZE = 8

export interface CartItem extends Project {
  amount: string
  isCleared: boolean // Item has been removed from cart and its amount cleared
}

export interface Contributor {
  keypair: Keypair
  stateIndex: number
}

export function getCartStorageKey(roundAddress: string): string {
  return `cart-${roundAddress.toLowerCase()}`
}

export function getCommittedCartStorageKey(roundAddress: string): string {
  return `committed-cart-${roundAddress.toLowerCase()}`
}

export function getContributorStorageKey(roundAddress: string): string {
  return `contributor-${roundAddress.toLowerCase()}`
}

export function serializeCart(cart: CartItem[]): string {
  return JSON.stringify(cart)
}

export function deserializeCart(data: string | null): CartItem[] {
  if (data) {
    return JSON.parse(data)
  } else {
    return []
  }
}

export function serializeContributorData(contributor: Contributor): string {
  return JSON.stringify({
    privateKey: contributor.keypair.privKey.serialize(),
    stateIndex: contributor.stateIndex,
  })
}

export function deserializeContributorData(
  data: string | null
): Contributor | null {
  if (data) {
    const parsed = JSON.parse(data)
    const keypair = new Keypair(PrivKey.unserialize(parsed.privateKey))
    return { keypair, stateIndex: parsed.stateIndex }
  } else {
    return null
  }
}

export async function getContributionAmount(
  fundingRoundAddress: string,
  contributorAddress: string
): Promise<BigNumber> {
  const data = await sdk.GetContributionsAmount({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
    contributorAddress,
  })

  if (!data.contributions?.length) {
    return BigNumber.from(0)
  }

  return BigNumber.from(data.contributions[0].amount)
}

export async function withdrawContribution(
  roundAddress: string,
  signer: Signer
): Promise<TransactionResponse> {
  const fundingRound = new Contract(roundAddress, FundingRound, signer)
  const transaction = await fundingRound.withdrawContribution()
  return transaction
}

export async function hasContributorVoted(
  fundingRoundAddress: string,
  contributorAddress: string
): Promise<boolean> {
  const data = await sdk.GetContributorVotes({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
    contributorAddress,
  })
  return !!data.fundingRound?.contributors?.[0]?.votes?.length
}

export function isContributionAmountValid(
  value: string,
  currentRound: RoundInfo
): boolean {
  if (!currentRound) {
    // Skip validation
    return true
  }
  const { nativeTokenDecimals, voiceCreditFactor } = currentRound
  let amount
  try {
    amount = parseFixed(value, nativeTokenDecimals)
  } catch {
    return false
  }
  if (amount.lte(BigNumber.from(0))) {
    return false
  }
  const normalizedValue = FixedNumber.fromValue(
    amount.div(voiceCreditFactor).mul(voiceCreditFactor),
    nativeTokenDecimals
  )
    .toUnsafeFloat()
    .toString()
  return normalizedValue === value
}

/**
 *  Get the MACI contributor state index
 * @param fundingRoundAddress Funding round contract address
 * @param pubKey Contributor public key
 * @returns Contributor stateIndex returned from MACI
 */
export async function getContributorIndex(
  fundingRoundAddress: string,
  pubKey: PubKey
): Promise<number | null> {
  const id = getPubKeyId(pubKey)
  const data = await sdk.GetContributorIndex({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
    publicKeyId: id,
  })

  return data.publicKey?.stateIndex ? Number(data.publicKey?.stateIndex) : null
}

/**
 * Get the latest set of vote messages submitted by contributor
 * @param fundingRoundAddress Funding round contract address
 * @param contributorKey Contributor key used to encrypt messages
 * @param coordinatorPubKey Coordinator public key
 * @returns MACI messages
 */
export async function getContributorMessages(
  fundingRoundAddress: string,
  contributorKey: Keypair,
  coordinatorPubKey: PubKey
): Promise<Message[]> {
  const key = getPubKeyId(contributorKey.pubKey)

  const result = await sdk.GetContributorMessages({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
    pubKey: key,
  })

  if (!(result.messages && result.messages?.length)) {
    return []
  }

  const sharedKey = Keypair.genEcdhSharedKey(
    contributorKey.privKey,
    coordinatorPubKey
  )

  let latestTransaction: Transaction | null = null
  const latestMessages = result.messages
    .map((message) => {
      const { iv, data, blockNumber, transactionIndex } = message
      const maciMessage = new Message(iv, data || [])

      const { command } = Command.decrypt(maciMessage, sharedKey)
      const { newPubKey } = command

      // ignore key change messages, which have different pubkey,
      //  as they don't have cart item information
      if (!newPubKey) {
        const currentTx = new Transaction({
          blockNumber: Number(blockNumber),
          transactionIndex: Number(transactionIndex),
        })
        if (!latestTransaction || currentTx.compare(latestTransaction) > 0) {
          latestTransaction = currentTx
        }
      }
      return message
    })
    .filter((message) => {
      const tx = new Transaction({
        blockNumber: Number(message.blockNumber),
        transactionIndex: Number(message.transactionIndex),
      })
      return latestTransaction && tx.compare(latestTransaction) === 0
    })

  if (latestMessages.length <= 0) {
    return []
  }

  return latestMessages.map((message) => {
    const { iv, data } = message
    return new Message(iv, data || [])
  })
}
