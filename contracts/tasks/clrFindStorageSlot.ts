/**
 * This is a best effort to find the storage slot used to query eth_getProof from
 * the first 50 slots
 * This assumes that `holder` holds a positive balance of tokens
 *
 * Copied from findMapSlot() from
 * https://github.com/vocdoni/storage-proofs-eth-js/blob/main/src/erc20.ts#L62
 *
 *
 * Usage: hardhat clr-find-storage-slot --token <token-address> --holder <account-address> --network arbitrum
 */

import { task, types } from 'hardhat/config'
import { Contract, toBeHex } from 'ethers'
import { getStorageKey } from '@clrfund/common'

const ERC20_ABI = [
  'function balanceOf(address _owner) public view returns (uint256 balance)',
]

task(
  'clr-find-storage-slot',
  'Find the balanceOf storage slot for an ERC20 token'
)
  .addParam('token', 'ERC20 contract address')
  .addParam('holder', 'The address of a token holder')
  .addOptionalParam('maxSlot', 'Maximum slots to try', 50, types.int)
  .setAction(async ({ token, holder, maxSlot }, { ethers, network }) => {
    const blockNumber = await ethers.provider.getBlockNumber()
    const blockNumberHex = toBeHex(blockNumber)
    const tokenInstance = new Contract(token, ERC20_ABI, ethers.provider)
    const balance = BigInt(await tokenInstance.balanceOf(holder))
    if (balance === BigInt(0)) {
      console.log(
        'The holder has no balance, try a different holder with a positive balance of tokens'
      )
      return
    }

    for (let pos = 0; pos < maxSlot; pos++) {
      try {
        const storageKey = getStorageKey(holder, pos)

        const value = await network.provider.send('eth_getStorageAt', [
          token,
          storageKey,
          blockNumberHex,
        ])

        const onChainBalance = BigInt(value)
        if (onChainBalance !== balance) continue

        console.log('Storage slot index', pos)
        return
      } catch (err) {
        continue
      }
    }

    console.log('Unable to find slot index')
  })
