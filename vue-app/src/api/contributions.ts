import { BigNumber, Contract, Signer, FixedNumber, utils } from 'ethers'
import { parseFixed } from '@ethersproject/bignumber'

import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Keypair, PrivKey, PubKey, Message, Command } from '@clrfund/maci-utils'

import { RoundInfo } from './round'
import { FundingRound } from './abi'
import { Project } from './projects'
import sdk from '@/graphql/sdk'

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
 * @param contributorAddress Contributor wallet address
 * @returns Contributor stateIndex returned from MACI
 */
export async function getContributorIndex(
  fundingRoundAddress: string,
  contributorAddress: string
): Promise<number | null> {
  const data = await sdk.GetContributorIndex({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
    contributorAddress: contributorAddress.toLowerCase(),
  })

  return data.publicKey?.stateIndex ? Number(data.publicKey?.stateIndex) : null
}

/**
 * Check whether a message was encrypted using the same key
 * @param message the message to be checked
 * @param sharedKey shared key to decrypt the message
 * @param pubKey public key to check if the decrypted message has the same key
 * @returns true if it is a key change message, false otherwise
 */
function isSamePubKey(
  message: Message,
  sharedKey: BigInt,
  pubKey: PubKey
): boolean {
  const { command } = Command.decrypt(message, sharedKey)
  const { newPubKey } = command
  const newPubKeyPair = newPubKey.asContractParam()
  const pubKeyPair = pubKey.asContractParam()
  return newPubKeyPair.x === pubKeyPair.x && newPubKeyPair.y === pubKeyPair.y
}

/**
 * Get the latest set of vote messages submitted by contributor
 * @param fundingRoundAddress Funding round contract address
 * @param contributorAddress Contributor wallet address
 * @param sharedKey Key to decrypt messages
 * @returns MACI messages
 */
export async function getContributorMessages(
  fundingRoundAddress: string,
  pubKey: PubKey,
  sharedKey: BigInt
): Promise<Message[]> {
  const pubKeyPair = pubKey.asContractParam()
  const key = utils.id(pubKeyPair.x + '.' + pubKeyPair.y)

  const result = await sdk.GetContributorMessages({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
    pubKey: key,
  })

  if (!(result.messages && result.messages?.length)) {
    return []
  }

  let newestBlock = result.messages[0].blockNumber
  let newestTxIndex = result.messages[0].transactionIndex
  const latestMessages = result.messages
    .map((message) => {
      const { iv, data } = message
      const maciMessage = new Message(iv, data as BigInt[])

      // ignore key change messages as they don't have cart item information
      // Note: currently, the ui can only display messages encrypted with
      // the wallet signature. If there's a key chain done outside of the ui,
      // new cart updates won't be displayed on the ui
      if (isSamePubKey(maciMessage, sharedKey, pubKey)) {
        if (message.blockNumber > newestBlock) {
          newestBlock = message.blockNumber
        } else if (
          message.blockNumber == newestBlock &&
          message.transactionIndex > newestTxIndex
        ) {
          newestTxIndex = message.transactionIndex
        }
      }
      return message
    })
    .filter(
      (message) =>
        message.blockNumber === newestBlock &&
        message.transactionIndex === newestTxIndex
    )

  if (latestMessages.length <= 0) {
    return []
  }

  return latestMessages.map((message) => {
    const { iv, data } = message
    return new Message(iv, data as BigInt[])
  })
}
