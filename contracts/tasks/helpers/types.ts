// Modified from https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/tasks/helpers/types.ts

import { BaseContract, ContractTransactionResponse, Signer } from 'ethers'
import { EContracts } from '../../utils/types'
import type { Libraries, TaskArguments } from 'hardhat/types'

/**
 * Interface that represents contract storage named entry
 */
export interface IStorageNamedEntry {
  /**
   * Contract address
   */
  address: string

  /**
   * Count of deployed instances
   */
  count: number
}

/**
 * Interface that represents contract storage instance entry
 */
export interface IStorageInstanceEntry {
  /**
   * Entry identificator
   */
  id: string

  /**
   * The transaction hash that this instance was created
   */
  txHash?: string

  /**
   * Params for verification
   */
  verify?: {
    args?: string
    impl?: string
    subType?: string
  }
}

/**
 * Interface that represents subtask params
 */
export interface ISubtaskParams {
  /**
   * Param for verification toggle
   */
  verify: boolean

  /**
   * Param for incremental task toggle
   */
  incremental: boolean

  /**
   * Param for manually managed nonce
   * This is useful for interacting with testnet nodes
   * that are not optimally configured causing nonce too low error
   */
  manageNonce?: boolean

  /**
   * Consider warning as errors
   */
  strict?: boolean

  /**
   * Skip steps with less or equal index
   */
  skip?: number

  /**
   * The duration of a new funding round. This is only used when starting
   * a new round
   */
  roundDuration?: number

  /**
   * The ClrFund contract address
   */
  clrfund?: string
}

/**
 * Interface that represents register contract arguments
 */
export interface IRegisterContract {
  /**
   * Contract enum identifier
   */
  id: EContracts

  /**
   * Contract instance
   */
  contract: BaseContract

  /**
   * network name
   */
  network: string

  /**
   * Contract deployment arguments
   */
  args?: unknown[]

  /**
   * Contract deployment transaction
   */
  tx?: ContractTransactionResponse
}

/**
 * Interface that represents subtask step catalog
 */
export interface ISubtaskStepCatalog {
  /**
   * Step name
   */
  name: string

  /**
   * Task name
   */
  taskName: string

  /**
   * Params function with task arguments
   *
   * @param params task params
   * @returns task arguments
   */
  paramsFn: (params: ISubtaskParams) => Promise<TaskArguments>
}

/**
 * Interface that represents subtask step
 */
export interface ISubtaskStep {
  /**
   * Step name
   */
  name: string

  /**
   * Subtask name
   */
  taskName: string

  /**
   * Subtask arguments
   */
  args: TaskArguments
}

/**
 * Interface that represents `Subtask#getContract` params
 */
export interface IGetContractParams {
  /**
   * Contract name
   */
  name: EContracts

  /**
   * Contract address
   */
  address?: string

  /**
   * Eth signer
   */
  signer?: Signer
}

/**
 * Interface that represents verify arguments
 */
export interface IVerifyAllArgs {
  /**
   * Ignore verified status
   */
  force?: boolean
}

/**
 * Interface that represents verification subtask arguments
 * This is extracted from hardhat etherscan plugin
 */
export interface IVerificationSubtaskArgs {
  /**
   * Contract address
   */
  address: string

  /**
   * Constructor arguments
   */
  constructorArguments: unknown[]

  /**
   * Fully qualified name of the contract
   */
  contract?: string

  /**
   * Libraries
   */
  libraries?: Libraries
}

export interface IDeployContractOptions {
  /**
   * Contract constructor argument
   */
  args?: unknown[]

  /**
   * Eth signer
   */
  signer?: Signer

  /**
   * Libraries
   */
  libraries?: Libraries
}

export { EContracts }
