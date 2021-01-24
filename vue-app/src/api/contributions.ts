import { BigNumber, Contract, Signer } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Keypair, PrivKey } from 'maci-domainobjs'

import { FundingRound } from './abi'
import { provider } from './core'
import { Project } from './projects'
import { storage } from './storage'
import { User } from './user'

export const DEFAULT_CONTRIBUTION_AMOUNT = 5
export const MAX_CONTRIBUTION_AMOUNT = 10000 // See FundingRound.sol

// The batch of maximum size will burn 9100000 gas at 700000 gas per message
export const MAX_CART_SIZE = 13

export interface CartItem extends Project {
  amount: string;
  isCleared: boolean; // Item has been removed from cart and its amount cleared
}

export interface Contributor {
  keypair: Keypair;
  stateIndex: number;
}

function getCartStorageKey(roundAddress: string): string {
  return `cart-${roundAddress.toLowerCase()}`
}

function getContributorStorageKey(roundAddress: string): string {
  return `contributor-${roundAddress.toLowerCase()}`
}

export function saveCart(
  user: User,
  roundAddress: string,
  cart: CartItem[],
) {
  storage.setItem(
    user.walletAddress,
    user.encryptionKey,
    getCartStorageKey(roundAddress),
    JSON.stringify(cart),
  )
}

export function loadCart(
  user: User,
  roundAddress: string,
): CartItem[] {
  const serializedData = storage.getItem(
    user.walletAddress,
    user.encryptionKey,
    getCartStorageKey(roundAddress),
  )
  if (serializedData) {
    return JSON.parse(serializedData)
  } else {
    return []
  }
}

export function saveContributorData(
  user: User,
  roundAddress: string,
  contributor: Contributor,
) {
  const serializedData = JSON.stringify({
    privateKey: contributor.keypair.privKey.serialize(),
    stateIndex: contributor.stateIndex,
  })
  storage.setItem(
    user.walletAddress,
    user.encryptionKey,
    getContributorStorageKey(roundAddress),
    serializedData,
  )
}

export function loadContributorData(
  user: User,
  roundAddress: string,
): Contributor | null {
  const serializedData = storage.getItem(
    user.walletAddress,
    user.encryptionKey,
    getContributorStorageKey(roundAddress),
  )
  if (serializedData) {
    const data = JSON.parse(serializedData)
    const keypair = new Keypair(PrivKey.unserialize(data.privateKey))
    return { keypair, stateIndex: data.stateIndex }
  } else {
    return null
  }
}

export async function getContributionAmount(
  fundingRoundAddress: string,
  contributorAddress: string,
): Promise<BigNumber> {
  const fundingRound = new Contract(
    fundingRoundAddress,
    FundingRound,
    provider,
  )
  const filter = fundingRound.filters.Contribution(contributorAddress)
  const events = await fundingRound.queryFilter(filter, 0)
  const event = events[0]
  if (!event || !event.args) {
    return BigNumber.from(0)
  }
  return event.args._amount
}

export async function getTotalContributed(
  fundingRoundAddress: string,
): Promise<BigNumber> {
  const fundingRound = new Contract(
    fundingRoundAddress,
    FundingRound,
    provider,
  )
  const filter = fundingRound.filters.Contribution()
  const events = await fundingRound.queryFilter(filter, 0)
  let result = BigNumber.from(0)
  events.forEach(event => {
    if (!event.args) {
      return
    }
    result = result.add(event.args._amount)
  })
  return result
}

export async function withdrawContribution(
  roundAddress: string,
  signer: Signer,
): Promise<TransactionResponse> {
  const fundingRound = new Contract(roundAddress, FundingRound, signer)
  const transaction = await fundingRound.withdrawContribution()
  return transaction
}
