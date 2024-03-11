import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  Contract,
  ContractTransaction,
  InfuraProvider,
  ZeroAddress,
  ZeroHash,
} from 'ethers'
import {
  Block,
  getBlock,
  getAccountProof,
  getStorageProof,
  rlpEncodeProof,
} from '@clrfund/common'

// Accounts from arbitrum-goerli to call eth_getProof as hardhat network
// does not support eth_getProof
const provider = new InfuraProvider('arbitrum-goerli')

const tokens = [
  {
    address: '0x65bc8dd04808d99cf8aa6749f128d55c2051edde',
    type: 'ERC20',
    // get proof with this block number
    snapshotBlock: 35904051,
    // storage slot for balances in the token (0x65bc8dd04808d99cf8aa6749f128d55c2051edde) on arbitrum goerli
    storageSlot: 2,
    holders: {
      currentAndSnapshotHolder: '0x0B0Fe9D858F7e3751A3dcC7ffd0B9236be5E4bf5',
      snapshotHolder: '0xBa8aC318F2dd829AF3D0D93882b4F1a9F3307bFD',
      currentHolderOnly: '0x5Fd5b076F6Ba8E8195cffb38A028afe5694b3d27',
      zeroBalance: '0xfb96F12fDD64D674631DB7B40bC35cFE74E98aF7',
    },
  },
  {
    address: '0x7E8206276F8FE511bfa44c9135B222DEe75e58f4',
    type: 'ERC721',
    snapshotBlock: 35904824,
    storageSlot: 3,
    holders: {
      currentAndSnapshotHolder: '0x980825655805509f47EbDE41515966aeD5Df883D',
      snapshotHolder: '0x326850D078c34cBF6996756523b00f0f1731dF12',
      currentHolderOnly: '0x8D4EFdF0891DC38AC3DA2C3C5E683C982D3F7426',
      zeroBalance: '0x99c68BFfF94d70f736491E9824caeDd19307167B',
    },
  },
]

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
  userRegistry: Contract,
  tokenAddress: string,
  storageSlot: number
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

describe.skip('SnapshotUserRegistry', function () {
  let userRegistry: Contract
  let block: Block

  before(async function () {
    const [deployer] = await ethers.getSigners()

    const SnapshotUserRegistry = await ethers.getContractFactory(
      'SnapshotUserRegistry',
      deployer
    )
    userRegistry = await SnapshotUserRegistry.deploy()
  })

  describe('Set Storage Root', function () {
    const token = tokens[0]
    let accountProofRlpBytes: string
    before(async function () {
      block = await getBlock(token.snapshotBlock, provider)

      const proof = await getAccountProof(token.address, block.hash, provider)
      accountProofRlpBytes = rlpEncodeProof(proof.accountProof)
    })

    it('Should throw if token address is 0', async function () {
      await expect(
        userRegistry.setStorageRoot(
          ZeroAddress,
          block.hash,
          block.stateRoot,
          token.storageSlot,
          accountProofRlpBytes
        )
      ).to.be.revertedWith('SnapshotUserRegistry: Token address is zero')
    })

    it('Should throw if block hash is 0', async function () {
      await expect(
        userRegistry.setStorageRoot(
          token.address,
          ZeroHash,
          block.stateRoot,
          token.storageSlot,
          accountProofRlpBytes
        )
      ).to.be.revertedWith('SnapshotUserRegistry: Block hash is zero')
    })

    it('Should throw if state root is 0', async function () {
      await expect(
        userRegistry.setStorageRoot(
          token.address,
          block.hash,
          ZeroHash,
          token.storageSlot,
          accountProofRlpBytes
        )
      ).to.be.revertedWith('SnapshotUserRegistry: State root is zero')
    })
  })

  describe('Add user', function () {
    tokens.forEach((token) => {
      describe(token.type, function () {
        before(async function () {
          try {
            block = await getBlock(token.snapshotBlock, provider)

            const proof = await getAccountProof(
              token.address,
              block.hash,
              provider
            )
            const accountProofRlpBytes = rlpEncodeProof(proof.accountProof)
            const tx = await userRegistry.setStorageRoot(
              token.address,
              block.hash,
              block.stateRoot,
              token.storageSlot,
              accountProofRlpBytes
            )
            await tx.wait()
          } catch (err) {
            console.log('error setting storage hash', err)
            throw err
          }
        })

        it('Shoule be able to add a user that meets requirement', async function () {
          this.timeout(200000)

          const userAccount = token.holders.currentAndSnapshotHolder
          await expect(
            addUser(
              userAccount,
              block.hash,
              userRegistry,
              token.address,
              token.storageSlot
            )
          )
            .to.emit(userRegistry, 'UserAdded')
            .withArgs(userAccount, block.hash)
          expect(await userRegistry.isVerifiedUser(userAccount)).to.equal(true)
        })

        it('Shoule not add non-holder', async function () {
          this.timeout(200000)

          const user = ethers.Wallet.createRandom()
          await expect(
            addUser(
              user.address,
              block.hash,
              userRegistry,
              token.address,
              token.storageSlot
            )
          ).to.be.revertedWith('SnapshotUserRegistry: User is not qualified')
          expect(await userRegistry.isVerifiedUser(user.address)).to.equal(
            false
          )
        })

        it('Should not add a user with token balance 0', async function () {
          this.timeout(200000)

          const user = { address: token.holders.zeroBalance }
          await expect(
            addUser(
              user.address,
              block.hash,
              userRegistry,
              token.address,
              token.storageSlot
            )
          ).to.be.revertedWith('SnapshotUserRegistry: User is not qualified')
          expect(await userRegistry.isVerifiedUser(user.address)).to.equal(
            false
          )
        })

        it('Shoule not add a user who currently meet the requirements, but did not at the snapshot block', async function () {
          this.timeout(200000)

          const userAddress = token.holders.currentHolderOnly
          await expect(
            addUser(
              userAddress,
              block.hash,
              userRegistry,
              token.address,
              token.storageSlot
            )
          ).to.be.revertedWith('SnapshotUserRegistry: User is not qualified')
          expect(await userRegistry.isVerifiedUser(userAddress)).to.equal(false)
        })

        it('Shoule add a user who met the requirement at the snapshot block, but not currently', async function () {
          this.timeout(200000)

          const userAddress = token.holders.snapshotHolder
          await expect(
            addUser(
              userAddress,
              block.hash,
              userRegistry,
              token.address,
              token.storageSlot
            )
          )
            .to.emit(userRegistry, 'UserAdded')
            .withArgs(userAddress, block.hash)
          expect(await userRegistry.isVerifiedUser(userAddress)).to.equal(true)
        })
      })
    })
  })
})
