import { Contract, FixedNumber, parseUnits, id } from 'ethers'
import type { TransactionResponse, Signer } from 'ethers'
import { Keypair, PubKey, PrivKey, Message, Command } from '@clrfund/common'

import type { RoundInfo } from './round'
import { FundingRound, ERC20 } from './abi'
import { clrFundContract, provider } from './core'
import type { Project } from './projects'
import sdk from '@/graphql/sdk'
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

/**
 * get the id of the subgraph public key entity from the pubKey value
 * @param fundingRoundAddress funding round address
 * @param pubKey MACI public key
 * @returns the id for the subgraph public key entity
 */
function getPubKeyId(fundingRoundAddress = '', pubKey: PubKey): string {
  const pubKeyPair = pubKey.asContractParam()
  return id(fundingRoundAddress.toLowerCase() + '.' + pubKeyPair.x + '.' + pubKeyPair.y)
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

export function deserializeContributorData(data: string | null): Contributor | null {
  if (data) {
    const parsed = JSON.parse(data)
    const keypair = new Keypair(PrivKey.deserialize(parsed.privateKey))
    return { keypair, stateIndex: parsed.stateIndex }
  } else {
    return null
  }
}

export async function getContributionAmount(fundingRoundAddress: string, contributorAddress: string): Promise<bigint> {
  if (!fundingRoundAddress) {
    return 0n
  }
  const data = await sdk.GetContributionsAmount({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
    contributorAddress: contributorAddress.toLowerCase(),
  })

  if (!data.contributions.length) {
    return 0n
  }

  return BigInt(data.contributions[0].amount)
}

export async function getTotalContributed(fundingRoundAddress: string): Promise<{ count: number; amount: bigint }> {
  const nativeTokenAddress = await clrFundContract.nativeToken()
  const nativeToken = new Contract(nativeTokenAddress, ERC20, provider)
  const balance = await nativeToken.balanceOf(fundingRoundAddress)

  const data = await sdk.GetTotalContributed({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
  })

  if (!data.fundingRound?.contributorCount) {
    return { count: 0, amount: 0n }
  }

  const count = parseInt(data.fundingRound.contributorCount)

  return { count, amount: balance }
}

export async function withdrawContribution(roundAddress: string, signer: Signer): Promise<TransactionResponse> {
  const fundingRound = new Contract(roundAddress, FundingRound, signer)
  const transaction = await fundingRound.withdrawContribution()
  return transaction
}

export function isContributionAmountValid(value: string, currentRound: RoundInfo): boolean {
  // if (!currentRound) {
  // 	// Skip validation
  // 	return true
  // }
  const { nativeTokenDecimals, voiceCreditFactor } = currentRound
  let amount: bigint
  try {
    amount = parseUnits(value, nativeTokenDecimals)
  } catch {
    return false
  }
  if (amount <= 0n) {
    return false
  }
  const normalizedValue = FixedNumber.fromValue((amount / voiceCreditFactor) * voiceCreditFactor, nativeTokenDecimals)
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
export async function getContributorIndex(fundingRoundAddress: string, pubKey: PubKey): Promise<number | null> {
  if (!fundingRoundAddress) {
    return null
  }
  const id = getPubKeyId(fundingRoundAddress, pubKey)
  const data = await sdk.GetContributorIndex({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
    publicKeyId: id,
  })

  if (data.publicKeys.length === 0) {
    return null
  }

  return Number(data.publicKeys[0].stateIndex)
}

/**
 * Convert to MACI Message object
 * @param type message type, 1 for key change or vote, 2 for topup
 * @param data message data
 * @returns Message
 */
function getMaciMessage(type: any, data: any[] | null): Message {
  const msgType = BigInt(type)
  const rawData = data || []
  const msgData = rawData.map((d: string) => BigInt(d))
  const maciMessage = new Message(BigInt(msgType), msgData)
  return maciMessage
}

/**
 * Get the latest set of vote messages submitted by contributor
 * @param fundingRoundAddress Funding round contract address
 * @param contributorKey Contributor key used to encrypt messages
 * @param coordinatorPubKey Coordinator public key
 * @returns MACI messages
 */
export async function getContributorMessages({
  fundingRoundAddress,
  contributorKey,
  coordinatorPubKey,
  contributorAddress,
}: {
  fundingRoundAddress: string
  contributorKey: Keypair
  coordinatorPubKey: PubKey
  contributorAddress: string
}): Promise<Message[]> {
  if (!fundingRoundAddress) {
    return []
  }

  const key = getPubKeyId(fundingRoundAddress, contributorKey.pubKey)
  const result = await sdk.GetContributorMessages({
    fundingRoundAddress: fundingRoundAddress.toLowerCase(),
    pubKey: key,
    contributorAddress: contributorAddress.toLowerCase(),
  })

  if (!(result.messages && result.messages.length)) {
    return []
  }

  const sharedKey = Keypair.genEcdhSharedKey(contributorKey.privKey, coordinatorPubKey)

  let latestTransaction: Transaction | null = null
  const latestMessages = result.messages
    .filter(message => {
      try {
        const maciMessage = getMaciMessage(message.msgType, message.data)
        const { command, signature } = Command.decrypt(maciMessage, sharedKey)
        if (!command.verifySignature(signature, contributorKey.pubKey)) {
          // Not signed by this user, filter it out
          return false
        }
      } catch {
        // if we can't decrypt the message, filter it out
        return false
      }

      const { blockNumber, transactionIndex } = message
      const currentTx = new Transaction({
        blockNumber: Number(blockNumber),
        transactionIndex: Number(transactionIndex),
      })

      // save the latest transaction
      if (!latestTransaction || currentTx.compare(latestTransaction) > 0) {
        latestTransaction = currentTx
      }
      return true
    })
    .filter(message => {
      const tx = new Transaction({
        blockNumber: Number(message.blockNumber),
        transactionIndex: Number(message.transactionIndex),
      })
      return latestTransaction && tx.compare(latestTransaction) === 0
    })
    .map(message => {
      return getMaciMessage(message.msgType, message.data)
    })

  return latestMessages
}
