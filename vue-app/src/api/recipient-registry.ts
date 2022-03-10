import { BigNumber, Contract } from 'ethers'
import sdk from '@/graphql/sdk'
import { BaseRecipientRegistry } from './abi'
import { provider, ipfsGatewayUrl, recipientRegistryPolicy } from './core'
import { chain } from '@/api/core'

export interface RegistryInfo {
  deposit: BigNumber
  depositToken: string
  challengePeriodDuration: number
  listingPolicyUrl: string
  recipientCount: number
  owner: string
}

export async function getRegistryInfo(
  registryAddress: string
): Promise<RegistryInfo> {
  const data = await sdk.GetRecipientRegistry({
    registryAddress: registryAddress.toLowerCase(),
  })

  const recipientRegistry = data.recipientRegistry
  const baseDeposit = recipientRegistry?.baseDeposit || BigNumber.from(0)
  const challengePeriodDuration =
    recipientRegistry?.challengePeriodDuration || BigNumber.from(0)
  const owner = recipientRegistry?.owner || ''

  /* TODO: get recipient count from the subgraph */
  const registry = new Contract(
    registryAddress,
    BaseRecipientRegistry,
    provider
  )
  const recipientCount = await registry.getRecipientCount()

  return {
    deposit: baseDeposit,
    depositToken: chain.currency,
    challengePeriodDuration: challengePeriodDuration.toNumber(),
    listingPolicyUrl: `${ipfsGatewayUrl}/ipfs/${recipientRegistryPolicy}`,
    recipientCount: recipientCount.toNumber(),
    owner,
  }
}
