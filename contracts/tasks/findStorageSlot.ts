/**
 * This is a best effort to find the storage slot used to query eth_getProof from
 * the first 50 slots
 * This assumes that `holder` holds a positive balance of tokens
 *
 * Copied from findMapSlot() from
 * https://github.com/vocdoni/storage-proofs-eth-js/blob/main/src/erc20.ts#L62
 *
 *
 * Usage: hardhat find-storage-slot --token <token-address> --holder <account-address> --network arbitrum
 */

import { task, types } from 'hardhat/config'
import { Contract, BigNumber } from 'ethers'
import { getStorageKey } from '@clrfund/common'

const ERC20_ABI = [
  'function balanceOf(address _owner) public view returns (uint256 balance)',
]

task('find-storage-slot', 'Find the storage slot for an ERC20 token')
  .addParam('token', 'ERC20 contract address')
  .addParam('holder', 'The address of a token holder')
  .addOptionalParam('maxSlot', 'Maximum slots to try', 50, types.int)
  .setAction(async ({ token, holder, maxSlot }, { ethers }) => {
    const blockNumber = await ethers.provider.getBlockNumber()
    const tokenInstance = new Contract(token, ERC20_ABI, ethers.provider)
    const balance = (await tokenInstance.balanceOf(holder)) as BigNumber
    if (balance.isZero()) {
      console.log(
        'The holder has no balance, try a different holder with a positive balance of tokens'
      )
      return
    }

    for (let pos = 0; pos < maxSlot; pos++) {
      try {
        const storageKey = getStorageKey(holder, pos)

        const value = await ethers.provider.getStorageAt(
          token,
          storageKey,
          blockNumber
        )

        const onChainBalance = BigNumber.from(value)
        if (!onChainBalance.eq(balance)) continue

        console.log('Storage slot index', pos)
        return
      } catch (err) {
        continue
      }
    }

    console.log('Unable to find slot index')
  })
