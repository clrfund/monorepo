import {
  BaseContract,
  ContractTransactionResponse,
  TransactionResponse,
} from 'ethers'
import { getEventArg } from '@clrfund/common'
import { EContracts } from './types'
import {
  DeployContractOptions,
  HardhatEthersHelpers,
} from '@nomicfoundation/hardhat-ethers/types'
import { VkRegistry } from '../typechain-types'
import { MaciParameters } from './maciParameters'
import { IVerifyingKeyStruct } from 'maci-contracts'

/**
 * Deploy a contract
 * @param name Name of the contract
 * @param ethers hardhat ethers handle
 * @param options options with signer, libraries or contract constructor args
 * @returns contract
 */
export async function deployContract<T extends BaseContract>(
  name: EContracts,
  ethers: HardhatEthersHelpers,
  options?: DeployContractOptions & { args?: unknown[]; quiet?: boolean }
): Promise<T> {
  const args = options?.args || []
  const contractName = String(name).includes('Poseidon') ? ':' + name : name
  const contract = await ethers.deployContract(contractName, args, options)
  await contract.waitForDeployment()

  if (options?.quiet === false) {
    console.log(`Deployed ${name} at ${contract.target}`)
  }
  return contract as BaseContract as T
}

/**
 * Set Verifying key
 * @param vkRegistry VKRegistry contract
 * @param maciParameters MACI tree depths and verifying key information
 * @returns transaction response
 */
export async function setVerifyingKeys(
  vkRegistry: VkRegistry,
  params: MaciParameters
): Promise<ContractTransactionResponse> {
  const messageBatchSize = params.getMessageBatchSize()
  const tx = await vkRegistry.setVerifyingKeys(
    params.stateTreeDepth,
    params.treeDepths.intStateTreeDepth,
    params.treeDepths.messageTreeDepth,
    params.treeDepths.voteOptionTreeDepth,
    messageBatchSize,
    params.processVk.asContractParam() as IVerifyingKeyStruct,
    params.tallyVk.asContractParam() as IVerifyingKeyStruct
  )

  const receipt = await tx.wait()
  if (receipt?.status !== 1) {
    throw new Error('Failed to set verifying key; transaction receipt status 1')
  }
  return tx
}

/**
 * Get the gas usage
 * @param transaction The transaction handle
 * @returns Gas used
 */
export async function getGasUsage(
  transaction: TransactionResponse
): Promise<number> {
  const receipt = await transaction.wait()
  return receipt ? Number(receipt.gasUsed) : 0
}

/**
 * Get the transaction fee
 * @param transaction The transaction handle
 * @returns Gas fee
 */
export async function getTxFee(
  transaction: TransactionResponse
): Promise<bigint> {
  const receipt = await transaction.wait()
  // effectiveGasPrice was introduced by EIP1559
  return receipt ? BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice) : 0n
}

export { getEventArg }
