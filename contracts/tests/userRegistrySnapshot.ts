import { ethers } from 'hardhat'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Contract, ContractTransaction, providers } from 'ethers'
import {
  Block,
  getBlock,
  getAccountProof,
  getStorageProof,
  rlpEncodeProof,
} from '@clrfund/common'

use(solidity)

// Accounts from arbitrum-goerli to call eth_getProof as hardhat network
// does not support eth_getProof
const tokenAddress = '0x65bc8dd04808d99cf8aa6749f128d55c2051edde'
const userAccount = '0x0B0Fe9D858F7e3751A3dcC7ffd0B9236be5E4bf5'

// storage slot for balances in the token (0x65bc8dd04808d99cf8aa6749f128d55c2051edde) on arbitrum goerli
const storageSlot = 2

// get proof with this block number
const blockNumber = 34677758

const provider = new providers.InfuraProvider('arbitrum-goerli')

/**
 * Add a user to the snapshotUserRegistry
 * @param userAccount The user address to add
 * @param block Block containing the state root
 * @param userRegistry The user registry contract
 * @returns transaction
 */
async function addUser(
  userAccount: string,
  blockHash: string,
  userRegistry: Contract
): Promise<ContractTransaction> {
  const proof = await getStorageProof(
    tokenAddress,
    blockHash,
    userAccount,
    storageSlot,
    provider
  )

  const storageRoot = await userRegistry.storageRoot()
  expect(proof.storageHash).to.equal(storageRoot)

  const proofRlpBytes = rlpEncodeProof(proof.storageProof[0].proof)
  return userRegistry.addUser(userAccount, proofRlpBytes)
}

describe('SnapshotUserRegistry', function () {
  let userRegistry: Contract
  let block: Block

  before(async function () {
    const [deployer] = await ethers.getSigners()

    const SnapshotUserRegistry = await ethers.getContractFactory(
      'SnapshotUserRegistry',
      deployer
    )
    userRegistry = await SnapshotUserRegistry.deploy()

    block = await getBlock(blockNumber, provider)

    try {
      const proof = await getAccountProof(tokenAddress, block.hash, provider)
      const accountProofRlpBytes = rlpEncodeProof(proof.accountProof)
      const tx = await userRegistry.setStorageRoot(
        tokenAddress,
        block.hash,
        block.stateRoot,
        storageSlot,
        accountProofRlpBytes
      )
      await tx.wait()
    } catch (err) {
      console.log('error setting storage hash', err)
      throw err
    }
  })

  describe('Add user', function () {
    it('Shoule be able to add a user that meets requirement', async function () {
      this.timeout(200000)

      await expect(addUser(userAccount, block.hash, userRegistry))
        .to.emit(userRegistry, 'UserAdded')
        .withArgs(userAccount)
      expect(await userRegistry.isVerifiedUser(userAccount)).to.equal(true)
    })

    it('Shoule not add a user with token balance 0', async function () {
      this.timeout(200000)

      const user = ethers.Wallet.createRandom()
      await expect(
        addUser(user.address, block.hash, userRegistry)
      ).to.be.revertedWith('UserRegistry: User not qualified as a contributor')
      expect(await userRegistry.isVerifiedUser(user.address)).to.equal(false)
    })
  })

  describe('Reject user', function () {
    it('Shoule be able to reject a user', async function () {
      this.timeout(200000)

      const isVerified = await userRegistry.isVerifiedUser(userAccount)
      if (!isVerified) {
        const tx = await addUser(userAccount, block.hash, userRegistry)
        await tx.wait()
      }

      await expect(userRegistry.rejectUser(userAccount))
        .to.emit(userRegistry, 'UserRejected')
        .withArgs(userAccount)
      expect(await userRegistry.isVerifiedUser(userAccount)).to.equal(false)

      await expect(
        addUser(userAccount, block.hash, userRegistry)
      ).to.be.revertedWith('UserRegistry: User already added')
    })
  })

  describe('Reset user', function () {
    it('Shoule be able to add a user after it has been reset', async function () {
      this.timeout(200000)

      await expect(userRegistry.resetUser(userAccount))
        .to.emit(userRegistry, 'UserReset')
        .withArgs(userAccount)
      expect(await userRegistry.isVerifiedUser(userAccount)).to.equal(false)

      await expect(addUser(userAccount, block.hash, userRegistry))
        .to.emit(userRegistry, 'UserAdded')
        .withArgs(userAccount)
      expect(await userRegistry.isVerifiedUser(userAccount)).to.equal(true)
    })
  })
})
