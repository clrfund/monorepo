import { BigNumber, Contract, Signer } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Keypair, PrivKey } from 'maci-domainobjs'

import { FundingRound } from './abi'
import { Project } from './projects'
import sdk from '@/graphql/sdk'

export const DEFAULT_CONTRIBUTION_AMOUNT = 5
export const MAX_CONTRIBUTION_AMOUNT = 10000 // See FundingRound.sol

// The batch of maximum size will burn 9100000 gas at 700000 gas per message
export const MAX_CART_SIZE = 13

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
    fundingRoundAddress,
    contributorAddress,
  })

  if (!data.fundingRound?.contributors?.[0].contributions?.length) {
    return BigNumber.from(0)
  }

  return data.fundingRound.contributors[0].contributions[0].amount
}

export async function getTotalContributed(
  fundingRoundAddress: string
): Promise<{ count: number; amount: BigNumber }> {
  const data = await sdk.GetTotalContributed({ fundingRoundAddress })

  if (!data.fundingRound?.contributors) {
    return { count: 0, amount: BigNumber.from(0) }
  }

  const count = parseInt(data.fundingRound.contributorCount)

  // TODO: lets see if we can add this total amount into the subgraph itself
  const amount = data.fundingRound.contributors.reduce((total, contributor) => {
    if (!contributor.contributions?.length) {
      return total
    }

    const subtotal = contributor.contributions.reduce((total, contribution) => {
      return total.add(contribution.amount)
    }, BigNumber.from(0))

    return total.add(subtotal)
  }, BigNumber.from(0))

  return { count, amount }
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
  // TODO: handle this event in the subgraph.

  // const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  // const filter = fundingRound.filters.Voted(contributorAddress)
  // const events = await fundingRound.queryFilter(filter, 0)
  // return events.length > 0
  return false
}
