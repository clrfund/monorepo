/**
 * This script set the storage root in the snapshot user registry
 *
 * Usage: hardhat set-storage-root --registry <user-registry-address> --slot <slot> --token <token-address> --block <block-number> --network arbitrum-goerli
 *
 * Note: get the slot number using the `find-storage-slot` task
 */

import { task, types } from 'hardhat/config'
import { getBlock, getAccountProof, rlpEncodeProof } from '@clrfund/common'
import { JsonRpcProvider } from 'ethers'

task('set-storage-root', 'Set the storage root in the snapshot user registry')
  .addParam('registry', 'The snapshot user registry contract address')
  .addParam('token', 'The token address')
  .addParam('block', 'The block number', undefined, types.int)
  .addParam(
    'slot',
    'The slot index of the balanceOf storage',
    undefined,
    types.int
  )
  .setAction(async ({ token, slot, registry, block }, { ethers, network }) => {
    const userRegistry = await ethers.getContractAt(
      'SnapshotUserRegistry',
      registry
    )

    const providerUrl = (network.config as any).url
    const jsonRpcProvider = new JsonRpcProvider(providerUrl)
    const blockInfo = await getBlock(block, jsonRpcProvider)
    const proof = await getAccountProof(token, blockInfo.hash, jsonRpcProvider)
    const accountProofRlp = rlpEncodeProof(proof.accountProof)
    const tx = await userRegistry.setStorageRoot(
      token,
      blockInfo.hash,
      blockInfo.stateRoot,
      slot,
      accountProofRlp
    )

    console.log('Set storage root at tx hash', tx.hash)
    await tx.wait()
  })
