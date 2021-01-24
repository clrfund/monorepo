import { BigNumber, Contract, Signer } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Keypair, PrivKey } from 'maci-domainobjs'

import { FundingRound } from './abi'
import { provider } from './core'
import { Project } from './projects'

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

export function getCartStorageKey(roundAddress: string): string {
  return `cart-${roundAddress.toLowerCase()}`
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
    const keypair = new Keypair(PrivKey.unserialize(parsed.privateKey))
    return { keypair, stateIndex: parsed.stateIndex }
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
