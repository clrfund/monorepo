// Modified from https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/tasks/helpers/Deployment.ts

import {
  BaseContract,
  Signer,
  NonceManager,
  ContractTransactionResponse,
  formatUnits,
} from 'ethers'
import { subtask as HardhatSubtask } from 'hardhat/config'

import { exit } from 'process'

import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import type {
  ConfigurableTaskDefinition,
  TaskArguments,
  HardhatRuntimeEnvironment,
} from 'hardhat/types'

import { deployContract } from '../../utils/contracts'
import { EContracts } from '../../utils/types'
import { ContractStorage } from './ContractStorage'
import {
  ISubtaskParams,
  ISubtaskStep,
  ISubtaskStepCatalog,
  IGetContractParams,
  IDeployContractOptions,
} from './types'
import { JSONFile } from '../../utils/JSONFile'
import { SUBTASK_CATALOGS } from '../subtasks'

const DEPLOY_CONFIG = './deploy-config.json'

/**
 * Internal deploy config structure type.
 */
type TConfig = {
  [key: string]: { [key: string]: { [key: string]: string | number | boolean } }
}

/**
 * @notice Deployment helper class to run sequential deploy using steps and deploy contracts.
 */
export class Subtask {
  /**
   * Singleton instance for class
   */
  private static INSTANCE?: Subtask

  /**
   * Hardhat runtime environment
   */
  private hre?: HardhatRuntimeEnvironment

  /**
   * Whether to use nonce manager to manually set nonce
   */
  private nonceManager?: NonceManager

  /**
   * Step catalog to create sequential tasks
   */
  private stepCatalog: Map<string, ISubtaskStepCatalog[]>

  /**
   * Json file database instance
   */
  private config: TConfig

  /**
   * Contract storage
   */
  private storage: ContractStorage

  /**
   * Record the start of deployer's balance here
   */
  private startBalance: bigint

  /**
   * Initialize class properties only once
   */
  private constructor(hre?: any) {
    this.stepCatalog = new Map(SUBTASK_CATALOGS.map((catalog) => [catalog, []]))
    this.hre = hre
    try {
      this.config = JSONFile.read(DEPLOY_CONFIG) as TConfig
    } catch (e) {
      if (e instanceof Error) {
        const regex = new RegExp('ENOENT: no such file or directory')
        if (regex.test(e.message)) {
          // silent about no deploy-config.json file error to allow
          // unit test to run without error
        } else {
          console.log('=======================')
          console.log('Failed to read', DEPLOY_CONFIG, e.message)
        }
      }
      this.config = {}
    }

    this.storage = ContractStorage.getInstance()

    // this will be set when start() or logStart() is called
    this.startBalance = 0n
  }

  /**
   * Get singleton object
   *
   * @returns {Subtask} singleton object
   */
  static getInstance(hre?: HardhatRuntimeEnvironment): Subtask {
    if (!Subtask.INSTANCE) {
      Subtask.INSTANCE = new Subtask(hre)
    }

    return Subtask.INSTANCE
  }

  /**
   * Start deploy with console log information
   *
   * @param {ISubtaskParams} params - deploy params
   */
  async start({ incremental }: ISubtaskParams): Promise<void> {
    this.checkHre(this.hre)
    const deployer = await this.getDeployer()
    const deployerAddress = await deployer.getAddress()
    this.startBalance = await deployer.provider.getBalance(deployer)

    console.log('Deployer address:', deployerAddress)
    console.log('Deployer start balance: ', formatUnits(this.startBalance))

    if (incremental) {
      console.log(
        '======================================================================'
      )
      console.log(
        '======================================================================'
      )
      console.log(
        '====================    ATTENTION! INCREMENTAL MODE    ==============='
      )
      console.log(
        '======================================================================'
      )
      console.log(
        "=========== Delete 'deployed-contracts.json' to start a new =========="
      )
      console.log(
        '======================================================================'
      )
      console.log(
        '======================================================================'
      )
    } else {
      this.storage.cleanup(this.hre.network.name)
    }

    console.log('Deployment started\n')
  }

  /**
   * Log the start of deployment with console log information
   *
   */
  async logStart(): Promise<void> {
    this.checkHre(this.hre)
    const deployer = await this.getDeployer()
    const deployerAddress = await deployer.getAddress()
    this.startBalance = await deployer.provider.getBalance(deployer)

    console.log('Deployer address:', deployerAddress)
    console.log('Deployer start balance: ', formatUnits(this.startBalance))

    console.log('Deployment started\n')
  }

  /**
   * Run deploy steps
   *
   * @param steps - deploy steps
   * @param skip - skip steps with less or equal index
   */
  async runSteps(steps: ISubtaskStep[], skip: number): Promise<void> {
    this.checkHre(this.hre)

    let stepNumber = 1
    // eslint-disable-next-line no-restricted-syntax
    for (const step of steps) {
      const stepId = `0${stepNumber}`
      console.log(
        '\n======================================================================'
      )
      console.log(stepId.slice(stepId.length - 2), step.name)
      console.log(
        '======================================================================\n'
      )

      if (stepNumber <= skip) {
        console.log(`STEP ${stepNumber} WAS SKIPPED`)
      } else {
        // eslint-disable-next-line no-await-in-loop
        await this.hre.run(step.taskName, step.args)
      }
      stepNumber++
    }
  }

  /**
   * Print deployment results and check warnings
   *
   * @param strict - fail on warnings is enabled
   * @throws error if strict is enabled and warning is found
   */
  async checkResults(strict?: boolean): Promise<void> {
    this.checkHre(this.hre)
    const deployer = await this.getDeployer()
    const deployerAddress = await deployer.getAddress()
    const [entryMap, instanceCount, multiCount] = this.storage.printContracts(
      deployerAddress,
      this.hre.network.name
    )
    let hasWarn = false

    if (multiCount > 0) {
      console.warn('WARNING: multi-deployed contract(s) detected')
      hasWarn = true
    } else if (entryMap.size !== instanceCount) {
      console.warn('WARNING: unknown contract(s) detected')
      hasWarn = true
    }

    entryMap.forEach((_, key) => {
      if (key.startsWith('Mock')) {
        console.warn('WARNING: mock contract detected:', key)
        hasWarn = true
      }
    })

    if (hasWarn && strict) {
      throw new Error('Warnings are present')
    }
  }

  /**
   * Finish deployment with console log information
   *
   * @param success - success or not
   */
  async finish(success: boolean): Promise<void> {
    this.checkHre(this.hre)
    const deployer = await this.getDeployer()
    const { gasPrice } = this.hre.network.config
    const endBalance = await deployer.provider.getBalance(deployer)

    console.log(
      '======================================================================'
    )
    console.log('Deployer end balance: ', formatUnits(endBalance))
    console.log(
      'Deploy expenses: ',
      formatUnits(this.startBalance - endBalance)
    )

    if (gasPrice !== 'auto') {
      console.log(
        'Deploy gas: ',
        (this.startBalance - endBalance) / BigInt(gasPrice),
        '@',
        gasPrice / 1e9,
        ' gwei'
      )
    }

    console.log(
      '======================================================================'
    )

    if (!success) {
      console.log('\nDeployment has failed')
      exit(1)
    }

    console.log('\nDeployment has finished')
  }

  /**
   * Get deployer (first signer) from hardhat runtime environment
   *
   * @returns {Promise<HardhatEthersSigner>} - signer
   */
  async getDeployer(signer?: Signer): Promise<HardhatEthersSigner> {
    this.checkHre(this.hre)

    let deployer: Signer | NonceManager

    if (this.nonceManager) {
      deployer = this.nonceManager
    } else {
      if (signer) {
        deployer = signer
      } else {
        ;[deployer] = await this.hre.ethers.getSigners()
      }
    }

    return deployer as unknown as HardhatEthersSigner
  }

  /**
   * Set hardhat runtime environment
   *
   * @param hre - hardhat runtime environment
   */
  setHre(hre: HardhatRuntimeEnvironment): void {
    this.hre = hre
  }

  /**
   * Check if hardhat runtime environment is set
   *
   * @throws {Error} error if there is no hardhat runtime environment set
   */
  private checkHre(
    hre: HardhatRuntimeEnvironment | undefined
  ): asserts hre is HardhatRuntimeEnvironment {
    if (!hre) {
      throw new Error('Hardhat Runtime Environment is not set')
    }
  }

  /**
   * Create a nonce manager to manage nonce for the signer
   *
   * @param signer - signer
   */
  setNonceManager(signer: Signer): void {
    this.nonceManager = new NonceManager(signer)
  }

  /**
   * Register a subtask by updating step catalog and return task definition
   *
   * @param taskName - unique task name
   * @param stepName - task description
   * @param paramsFn - optional function to override default task arguments
   * @returns {ConfigurableTaskDefinition} hardhat task definition
   */
  addTask(
    taskName: string,
    stepName: string,
    paramsFn?: (params: ISubtaskParams) => Promise<TaskArguments>
  ): ConfigurableTaskDefinition {
    const deployType = taskName.substring(0, taskName.indexOf(':'))
    this.addStep(deployType, {
      name: stepName,
      taskName,
      paramsFn: paramsFn || this.getDefaultParams,
    })

    return HardhatSubtask(taskName, stepName)
  }

  /**
   * Register deployment step
   *
   * @param deployType - deploy type
   * @param {ISubtaskStepCatalog} - deploy step catalog name, description and param mapper
   */
  private addStep(
    deployType: string,
    { name, taskName, paramsFn }: ISubtaskStepCatalog
  ): void {
    const steps = this.stepCatalog.get(deployType)

    if (!steps) {
      throw new Error(`Unknown deploy type: ${deployType}`)
    }

    steps.push({ name, taskName, paramsFn })
  }

  /**
   * Get default params from hardhat task
   *
   * @param {ISubtaskParams} params - hardhat task arguments
   * @returns {Promise<TaskArguments>} params for deploy workflow
   */
  private getDefaultParams = ({
    verify,
    incremental,
    clrfund,
    roundDuration,
  }: ISubtaskParams): Promise<TaskArguments> =>
    Promise.resolve({ verify, incremental, clrfund, roundDuration })

  /**
   * Get deploy step sequence
   *
   * @param deployTypes - list of deploy types
   * @param {ISubtaskParams} params - deploy params
   * @returns {Promise<ISubtaskStep[]>} deploy steps
   */
  async getDeploySteps(
    deployTypes: string[],
    params: ISubtaskParams
  ): Promise<ISubtaskStep[]> {
    const catalogSteps = deployTypes.map((deployType) =>
      this.stepCatalog.get(deployType)
    )

    let stepList: ISubtaskStepCatalog[] = []
    for (let i = 0; i < catalogSteps.length; i++) {
      const steps = catalogSteps[i]
      if (!steps) {
        throw new Error(`Unknown deploy type: ${deployTypes[i]}`)
      }

      stepList = stepList.concat(steps)
    }

    return Promise.all(stepList.map(({ paramsFn }) => paramsFn(params))).then(
      (stepArgs) =>
        stepArgs.map((args, index) => ({
          name: stepList[index].name,
          taskName: stepList[index].taskName,
          args: args as unknown,
        }))
    )
  }

  /**
   * Deploy contract and return it
   *
   * @param contractName - contract name
   * @param signer - signer
   * @param args - constructor arguments
   * @returns deployed contract
   */
  async deployContract<T extends BaseContract>(
    contractName: EContracts,
    options?: IDeployContractOptions
  ): Promise<T> {
    this.checkHre(this.hre)
    const signer = options?.signer
    const deployer = await this.getDeployer(signer)
    const args = options?.args || []
    const libraries = options?.libraries

    const contract = await deployContract(contractName, this.hre.ethers, {
      args,
      signer: deployer,
      libraries,
    })
    await contract.waitForDeployment()

    return contract as unknown as T
  }

  /**
   * Get deploy config field (see deploy-config.json)
   *
   * @param id - contract name
   * @param field - config field key
   * @returns config field value
   */
  getConfigField<T = string | number | boolean>(
    id: EContracts,
    field: string
  ): T {
    this.checkHre(this.hre)

    let value: T | null | undefined
    try {
      value = this.config[this.hre.network.name][id][field] as T
    } catch {
      value = undefined
    }

    if (value === null || value === undefined) {
      throw new Error(
        `Can't find ${this.hre.network.name}.${id}.${field} in ${DEPLOY_CONFIG}`
      )
    }

    return value
  }

  /**
   * Try to get deploy config field (see deploy-config.json)
   *
   * @param id - contract name
   * @param field - config field key
   * @returns config field value or undefined
   */
  tryGetConfigField<T = string | number | boolean>(
    id: EContracts,
    field: string
  ): T | undefined {
    let value: T | undefined
    try {
      value = this.getConfigField<T>(id, field)
    } catch {
      value = undefined
    }

    return value
  }

  /**
   * Get contract by name
   *
   * @param {IGetContractParams} params - params
   * @returns contract wrapper
   */
  async getContract<T extends BaseContract>({
    name,
    address,
    signer,
  }: IGetContractParams): Promise<T> {
    this.checkHre(this.hre)
    const deployer = await this.getDeployer(signer)
    const contractAddress =
      address || this.storage.mustGetAddress(name, this.hre.network.name)

    const { abi } = await this.hre.artifacts.readArtifact(name.toString())

    return new BaseContract(contractAddress, abi, deployer) as T
  }

  /**
   * Log transaction information to console
   *
   * @param {ContractTransactionResponse} tx - transaction
   */
  logTransaction(tx: ContractTransactionResponse): void {
    console.log(`tx: ${tx.hash}`)
    console.log(`nonce: ${tx.nonce}`)
    console.log(`deployer address: ${tx.from}`)
    console.log(`gas price: ${tx.gasPrice}`)
    console.log(`gas used: ${tx.gasLimit}`)
    console.log()
  }
}
