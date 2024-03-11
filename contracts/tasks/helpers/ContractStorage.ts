// Modified from https://github.com/privacy-scaling-explorations/maci/blob/dev/contracts/tasks/helpers/ContractStorage.ts
import {
  IStorageNamedEntry,
  IStorageInstanceEntry,
  IRegisterContract,
} from './types'

import { EContracts } from '../../utils/types'
import { JSONFile } from '../../utils/JSONFile'
import { Libraries } from '../../utils/deployment'

const DEPLOYED_CONTRACTS = './deployed-contracts.json'

/**
 * Used by JSON.stringify to serialize bigint
 * @param _key JSON key
 * @param value JSON value
 */
function bigintReplacer(_key: string, value: any) {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return value
}

/**
 * Internal storage structure type.
 * named: contracts can be queried by name
 * instance: contract can be queried by address
 * verified: mark contracts which are already verified
 */
type TStorage = Record<
  string,
  Partial<{
    named: Record<string, IStorageNamedEntry>
    instance: Record<string, IStorageInstanceEntry>
    verified: Record<string, boolean>
  }>
>

/**
 * @notice Contract storage keeps all deployed contracts with addresses, arguments in the json file.
 * This class is using for incremental deployment and verification.
 */
export class ContractStorage {
  /**
   * Singleton instance for class
   */
  private static INSTANCE?: ContractStorage

  /**
   * Json file database instance
   */
  private db: TStorage

  /**
   * Initialize class properties only once
   */
  private constructor() {
    try {
      this.db = JSONFile.read(DEPLOYED_CONTRACTS) as TStorage
    } catch {
      this.db = {} as TStorage
    }
  }

  /**
   * Get singleton object
   *
   * @returns {ContractStorage} singleton object
   */
  static getInstance(): ContractStorage {
    if (!ContractStorage.INSTANCE) {
      ContractStorage.INSTANCE = new ContractStorage()
    }

    return ContractStorage.INSTANCE
  }

  /**
   * Register contract and save contract address, constructor args in the json file
   *
   * @param {IRegisterContract} args - register arguments
   */
  async register({
    id,
    contract,
    network,
    args,
    tx,
  }: IRegisterContract): Promise<void> {
    const contractAddress = await contract.getAddress()

    const deploymentTx = contract.deploymentTransaction()

    console.log(`*** ${id} ***\n`)
    console.log(`Network: ${network}`)
    console.log(`contract address: ${contractAddress}`)

    if (deploymentTx) {
      console.log(`tx: ${deploymentTx.hash}`)
      console.log(`nonce: ${deploymentTx.nonce}`)
      console.log(`deployer address: ${deploymentTx.from}`)
      console.log(`gas price: ${deploymentTx.gasPrice}`)
      console.log(`gas used: ${deploymentTx.gasLimit}`)
    }

    console.log(`\n******`)
    console.log()

    const logEntry: IStorageInstanceEntry = {
      id,
      txHash: deploymentTx?.hash || tx?.hash,
    }

    if (args !== undefined) {
      logEntry.verify = {
        args: JSON.stringify(args, bigintReplacer),
      }
    }

    if (!this.db[network]) {
      this.db[network] = {}
    }

    const { instance, named } = this.db[network]

    this.db[network].instance = {
      ...instance,
      ...{ [contractAddress]: logEntry },
    }

    const count = named?.[id] ? named[id].count : 0
    const namedValue = {
      address: contractAddress,
      count: count + 1,
    }

    this.db[network].named = {
      ...named,
      ...{ [id]: namedValue },
    }

    JSONFile.write(DEPLOYED_CONTRACTS, this.db)
  }

  /**
   * Get contract instances from the json file
   *
   * @param network - selected network
   * @returns {[string, IStorageInstanceEntry][]} storage instance entries
   */
  getInstances(network: string): [string, IStorageInstanceEntry][] {
    if (!this.db[network]) {
      return Object.entries<IStorageInstanceEntry>([])
    }

    const collection = this.db[network].instance
    const value = collection as IStorageInstanceEntry[] | undefined

    return Object.entries<IStorageInstanceEntry>(value || [])
  }

  /**
   * Check if contract is verified or not locally
   *
   * @param address - contract address
   * @param network - selected network
   * @returns contract verified or not
   */
  getVerified(address: string, network: string): boolean {
    return Boolean(this.db[network].verified?.[address])
  }

  /**
   * Set contract verification in the json file
   *
   * @param address - contract address
   * @param network - selected network
   * @param verified - verified or not
   */
  setVerified = (address: string, network: string, verified: boolean): void => {
    const verifiedInfo = { [address]: verified }
    this.db[network].verified = {
      ...this.db[network].verified,
      ...verifiedInfo,
    }
    JSONFile.write(DEPLOYED_CONTRACTS, this.db)
  }

  /**
   * Get contract deployment transaction haash by address from the json file
   *
   * @param address - contract address
   * @param network - selected network
   * @returns contract deployment transaction hash
   */
  getTxHash(address: string, network: string): string | undefined {
    if (!this.db[network]) {
      return undefined
    }

    const instance = this.db[network].instance?.[address]
    return instance?.txHash
  }

  /**
   * Get contract address by name from the json file
   *
   * @param id - contract name
   * @param network - selected network
   * @returns contract address
   */
  getAddress(id: EContracts, network: string): string | undefined {
    if (!this.db[network]) {
      return undefined
    }
    const collection = this.db[network].named?.[id]
    const namedEntry = collection as IStorageNamedEntry | undefined

    return namedEntry?.address
  }

  /**
   * Get contract address by name from the json file
   *
   * @param id - contract name
   * @param network - selected network
   * @throws {Error} if there is no address the error will be thrown
   * @returns contract address
   */
  mustGetAddress(id: EContracts, network: string): string {
    const address = this.getAddress(id, network)

    if (!address) {
      throw new Error(`Contract ${id} is not saved`)
    }

    return address
  }

  /**
   * Get poseidon library addresses from the json file
   *
   * @param network - selected network
   * @throws {Error} if there is no address the error will be thrown
   * @returns Poseidon libraries
   */
  mustGetPoseidonLibraries(network: string): Libraries {
    const poseidonT3ContractAddress = this.mustGetAddress(
      EContracts.PoseidonT3,
      network
    )
    const poseidonT4ContractAddress = this.mustGetAddress(
      EContracts.PoseidonT4,
      network
    )
    const poseidonT5ContractAddress = this.mustGetAddress(
      EContracts.PoseidonT5,
      network
    )
    const poseidonT6ContractAddress = this.mustGetAddress(
      EContracts.PoseidonT6,
      network
    )

    return {
      PoseidonT3: poseidonT3ContractAddress,
      PoseidonT4: poseidonT4ContractAddress,
      PoseidonT5: poseidonT5ContractAddress,
      PoseidonT6: poseidonT6ContractAddress,
    }
  }

  /**
   * Get contract from the json file with sizes and multi count
   *
   * @param deployer - deployer address
   * @param network - selected network
   * @returns {[entries: Map<string, string>, length: number, multiCount: number]}
   */
  printContracts(
    deployer: string,
    network: string
  ): [Map<string, string>, number, number] {
    console.log('Contracts deployed at', network, 'by', deployer)
    console.log('---------------------------------')

    const entryMap = new Map<string, string>()
    const { named, instance } = this.db[network]
    const namedEntries = Object.entries<IStorageNamedEntry>(named || {})
    const instanceEntries = Object.entries<IStorageInstanceEntry>(
      instance || {}
    )

    let multiCount = 0

    namedEntries.forEach(([key, value]) => {
      if (value.count > 1) {
        console.log(`\t${key}: ${value.address} (N=${value.count})`)
        multiCount += value.count
      } else {
        console.log(`\t${key}: ${value.address}`)
        entryMap.set(key, value.address)
      }
    })

    console.log('---------------------------------')
    console.log(
      'N# Contracts:',
      entryMap.size + multiCount,
      '/',
      instanceEntries.length
    )

    return [entryMap, instanceEntries.length, multiCount]
  }

  /**
   * Clean json file for selected network
   *
   * @param network - selected network
   */
  cleanup(network: string): void {
    this.db[network] = {}
  }
}
