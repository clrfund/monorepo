import { task, types } from 'hardhat/config'
import { Contract, utils } from 'ethers'
import fs from 'fs'
import { StandardMerkleTree } from '@clrfund/common'
import { getIpfsHash } from '../utils/ipfs'

/*
 * Load users into the the merkle user registry by generating a merkle tree and
 * setting the merkle root of the merkle user registry. It will generate an output
 * file with the dump of the merkle tree. This file should be uploaded to the IPFS.
 *
 * File path can be relative or absolute path.
 * The script can only be run by the owner of the user registry
 *
 * Sample usage:
 *
 *  yarn hardhat load-merkle-users --address-file addresses.txt --user-registry <address> --network goerli
 */

/**
 * Load users in the file into the simple user registry
 *
 * @param registry Merkle user registry contract
 * @param addressFile The path of the file containing the addresses
 * @param output The path for the merkle tree output file
 */
async function loadFile(
  registry: Contract,
  addressFile: string,
  output: string
) {
  let content: string | null = null
  try {
    content = fs.readFileSync(addressFile, 'utf8')
  } catch (err) {
    console.error('Failed to read file', addressFile, err)
    return
  }

  const addresses: string[] = []
  content.split(/\r?\n/).forEach(async (address) => {
    addresses.push(address)
  })

  const validAddresses: string[] = []

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]
    const isValidAddress = Boolean(address) && utils.isAddress(address)
    if (isValidAddress) {
      console.log('Adding address', address)
      try {
        validAddresses.push(address)
      } catch (err: any) {
        if (err.reason) {
          console.error('Failed to add address', address, err.reason)
        } else {
          console.error('Failed to add address', address, err)
        }
      }
    } else {
      console.warn('Skipping invalid address', address)
    }
  }

  if (validAddresses.length > 0) {
    const tree = StandardMerkleTree.of(
      validAddresses.map((address) => [address]),
      ['address']
    )

    const treeDump = tree.dump()
    fs.writeFileSync(output, JSON.stringify(treeDump, null, 4))

    const ipfsHash = await getIpfsHash(treeDump)

    const tx = await registry.setMerkleRoot(tree.root, ipfsHash)
    return tx
  }
}

task('load-merkle-users', 'Bulkload recipients into the simple user registry')
  .addParam('userRegistry', 'The merkle user registry contract address')
  .addParam(
    'addressFile',
    'The path of the file containing addresses separated by newline'
  )
  .addOptionalParam(
    'output',
    'The output json file path for the merkle tree',
    undefined,
    types.string
  )
  .setAction(async ({ userRegistry, addressFile, output }, { ethers }) => {
    const registry = await ethers.getContractAt(
      'MerkleUserRegistry',
      userRegistry
    )

    console.log('User merkle registry', userRegistry)
    console.log('Deployer', await registry.signer.getAddress())
    const timeMs = new Date().getTime()
    const outputFile = output ? output : `./merkle_users_${timeMs}.json`
    const tx = await loadFile(registry, addressFile, outputFile)
    console.log('User merkle root updated at tx hash', tx.hash)
    await tx.wait()

    console.log(
      `User merkle tree file generated at ${outputFile}, make sure to upload it to IPFS.`
    )
  })
