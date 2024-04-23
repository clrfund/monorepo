import { ethers } from 'hardhat'
import { expect } from 'chai'
import { Contract, Wallet, zeroPadBytes, randomBytes } from 'ethers'
import { loadUserMerkleTree, getUserMerkleProof } from '@clrfund/common'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'

describe('Merkle User Registry', () => {
  let registry: Contract
  let tree: any
  let user1: HardhatEthersSigner
  let user2: HardhatEthersSigner
  const signers: Record<string, HardhatEthersSigner> = {}

  before(async () => {
    ;[, , user1, user2] = await ethers.getSigners()
    signers[user1.address] = user1
    signers[user2.address] = user2
  })

  beforeEach(async () => {
    const [, deployer] = await ethers.getSigners()
    const MerkleUserRegistry = await ethers.getContractFactory(
      'MerkleUserRegistry',
      deployer
    )
    registry = await MerkleUserRegistry.deploy()
    tree = loadUserMerkleTree(Object.keys(signers))
    const tx = await registry.setMerkleRoot(tree.root, 'test')
    await tx.wait()
  })

  it('rejects zero merkle root', async () => {
    await expect(
      registry.setMerkleRoot(zeroPadBytes('0x00', 32), 'testzero')
    ).to.be.revertedWith('MerkleUserRegistry: Merkle root is zero')
  })

  it('should not allow non-owner to set the merkle root', async () => {
    const registryAsUser = registry.connect(signers[user1.address]) as Contract
    await expect(
      registryAsUser.setMerkleRoot(randomBytes(32), 'non owner')
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  describe('registration', () => {
    it('allows valid verified user to register', async () => {
      for (const user of Object.keys(signers)) {
        const proof = getUserMerkleProof(user, tree)

        const registryAsUser = registry.connect(signers[user]) as Contract
        await expect(registryAsUser.addUser(user, proof))
          .to.emit(registryAsUser, 'UserAdded')
          .withArgs(user, tree.root)
        expect(await registryAsUser.isVerifiedUser(user)).to.equal(true)
      }
    })

    it('rejects unauthorized user', async () => {
      const user = ethers.Wallet.createRandom()
      const proof = tree.getProof(0)
      const registryAsUser = registry.connect(
        signers[user1.address]
      ) as Contract
      await expect(
        registryAsUser.addUser(user.address, proof)
      ).to.be.revertedWith('MerkleUserRegistry: User is not authorized')
      expect(await registryAsUser.isVerifiedUser(user.address)).to.equal(false)
    })

    it('should be able load 10k users', async function () {
      this.timeout(200000)

      const allAuthorizedUsers = Object.keys(signers)
      for (let i = 0; i < 10000; i++) {
        const randomWallet = Wallet.createRandom()
        allAuthorizedUsers.push(randomWallet.address)
      }
      tree = loadUserMerkleTree(allAuthorizedUsers)
      const tx = await registry.setMerkleRoot(tree.root, 'test')
      await tx.wait()

      const registryAsUser = registry.connect(user1) as Contract
      const proof = getUserMerkleProof(user1.address, tree)
      await expect(registryAsUser.addUser(user1.address, proof))
        .to.emit(registryAsUser, 'UserAdded')
        .withArgs(user1.address, tree.root)
      expect(await registryAsUser.isVerifiedUser(user1.address)).to.equal(true)
    })
  })
})
