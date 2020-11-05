import { Contract, Signer } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { formatBytes32String } from '@ethersproject/strings'

import { BrightIdUserRegistry } from './abi'
import { provider } from './core'

const NODE_URL = 'https://app.brightid.org/node/v5'
const CONTEXT = 'clr.fund'

export async function isSponsoredUser(
  registryAddress: string,
  userAddress: string,
): Promise<boolean> {
  const registry = new Contract(registryAddress, BrightIdUserRegistry, provider)
  const eventFilter = registry.filters.Sponsor(userAddress)
  const events = await registry.queryFilter(eventFilter, 0)
  return events.length > 0
}

export async function selfSponsor(
  registryAddress: string,
  signer: Signer,
): Promise<TransactionResponse> {
  const registry = new Contract(registryAddress, BrightIdUserRegistry, signer)
  const userAddress = await signer.getAddress()
  const transaction = await registry.sponsor(userAddress)
  return transaction
}

export function getBrightIdLink(userAddress: string): string {
  const nodeUrl = 'http:%2f%2fnode.brightid.org'
  const deepLink = `brightid://link-verification/${nodeUrl}/${CONTEXT}/${userAddress}`
  return deepLink
}

interface Verification {
  unique: boolean;
  contextIds: string[];
  sig: { r: string; s: string; v: number };
  timestamp: number;
}

async function checkVerification(userAddress: string): Promise<Verification | null> {
  const apiUrl = `${NODE_URL}/verifications/clr.fund/${userAddress}?signed=eth&timestamp=seconds`
  const response = await fetch(apiUrl)
  if (response.status === 200) {
    const data = await response.json()
    return data['data']['unique'] ? data['data'] : null
  } else if (response.status === 400 || response.status === 404) {
    return null
  } else {
    throw new Error('BrightID node is not available')
  }
}

export async function getVerification(userAddress: string): Promise<Verification> {
  const verification = await checkVerification(userAddress)
  if (verification !== null) {
    return verification
  }
  return await new Promise((resolve) => {
    const intervalId = setInterval(async () => {
      const verification = await checkVerification(userAddress)
      if (verification) {
        clearInterval(intervalId)
        resolve(verification)
      }
    }, 10000)
  })
}

export async function registerUser(
  registryAddress: string,
  verification: Verification,
  signer: Signer,
): Promise<TransactionResponse> {
  const registry = new Contract(registryAddress, BrightIdUserRegistry, signer)
  const transaction = await registry.register(
    formatBytes32String(CONTEXT),
    verification.contextIds,
    verification.timestamp,
    verification.sig.v,
    '0x' + verification.sig.r,
    '0x' + verification.sig.s,
  )
  return transaction
}
