import { Contract, BigNumber, Signer, ContractTransaction } from 'ethers'
import { UniversalRecipientRegistry } from './abi'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Project } from './projects'

export async function getProjects(
  registryAddress: string,
  startTime?: number,
  endTime?: number
): Promise<Project[]> {
  return []
}

export async function getProject(): Promise<Project | null> {
  return null
}

export async function addRecipient(
  registryAddress: string,
  recipientData: any,
  deposit: BigNumber,
  signer: Signer
): Promise<TransactionResponse> {
  const registry = new Contract(
    registryAddress,
    UniversalRecipientRegistry,
    signer
  )
  const { address, ...metadata } = recipientData
  const transaction = await registry.addRecipient(
    address,
    JSON.stringify(metadata),
    { value: deposit }
  )
  return transaction
}
