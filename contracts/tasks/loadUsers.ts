import { task } from 'hardhat/config'
import { Contract, ContractTransactionReceipt, isAddress } from 'ethers'
import fs from 'fs'

/*
 * Script to bulkload users into the simple user registry.
 * File path can be relative or absolute path.
 * The script can only be run by the owner of the simple user registry
 *
 * Sample usage:
 *
 *  yarn hardhat load-users --file-path addresses.txt --user-registry <address> --network goerli
 */

/**
 * Add a user to the Simple user registry
 *
 * @param registry Simple user registry contract
 * @param address User wallet address
 * @returns transaction receipt
 */
async function addUser(
  registry: Contract,
  address: string
): Promise<ContractTransactionReceipt> {
  const tx = await registry.addUser(address)
  const receipt = await tx.wait()
  return receipt
}

/**
 * Load users in the file into the simple user registry
 *
 * @param registry Simple user registry contract
 * @param filePath The path of the file containing the addresses
 */
async function loadFile(registry: Contract, filePath: string) {
  let content: string | null = null
  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch (err) {
    console.error('Failed to read file', filePath, err)
    return
  }

  const addresses: string[] = []
  content.split(/\r?\n/).forEach(async (address) => {
    addresses.push(address)
  })

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]
    const isValidAddress = Boolean(address) && isAddress(address)
    if (isValidAddress) {
      console.log('Adding address', address)
      try {
        const result = await addUser(registry, address)
        if (result.status !== 1) {
          throw new Error(
            `Transaction ${result.hash} failed with status ${result.status}`
          )
        }
      } catch (err: any) {
        if (err.reason) {
          console.error('Failed to add address', address, err.reason)
        } else {
          console.error('Failed to add address', address, err)
        }
      }
    } else if (address) {
      console.warn('Skipping invalid address', address)
    }
  }
}

task('load-users', 'Bulkload recipients into the simple user registry')
  .addParam('userRegistry', 'The simple user registry contract address')
  .addParam(
    'filePath',
    'The path of the file containing addresses separated by newline'
  )
  .setAction(async ({ userRegistry, filePath }, { ethers }) => {
    const registry = await ethers.getContractAt(
      'SimpleUserRegistry',
      userRegistry
    )

    await loadFile(registry, filePath)
  })
