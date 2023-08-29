import { ethers, waffle } from 'hardhat'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Contract, utils, Wallet } from 'ethers'
import { loadUserMerkleTree, getUserMerkleProof } from '@clrfund/common'

use(solidity)

describe('Merkle User Registry', () => {
  const provider = waffle.provider
  const [, deployer, user1, user2] = provider.getWallets()

  const signers = { [user1.address]: user1, [user2.address]: user2 }
  const authorizedUsers = [user1.address, user2.address]
  let registry: Contract
  let tree: any

  beforeEach(async () => {
    const MerkleUserRegistry = await ethers.getContractFactory(
      'MerkleUserRegistry',
      deployer
    )
    registry = await MerkleUserRegistry.deploy()
    tree = loadUserMerkleTree(authorizedUsers)
    const tx = await registry.setMerkleRoot(tree.root, 'test')
    await tx.wait()
  })

  it('rejects zero merkle root', async () => {
    await expect(
      registry.setMerkleRoot(utils.hexZeroPad('0x0', 32), 'testzero')
    ).to.be.revertedWith('MerkleUserRegistry: Merkle root is zero')
  })

  it('should not allow non-owner to set the merkle root', async () => {
    const registryAsUser = registry.connect(signers[user1.address])
    await expect(
      registryAsUser.setMerkleRoot(utils.hexZeroPad('0x1', 32), 'non owner')
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  describe('registration', () => {
    it('allows valid verified user to register', async () => {
      for (const user of authorizedUsers) {
        const proof = getUserMerkleProof(user, tree)

        const registryAsUser = registry.connect(signers[user])
        await expect(registryAsUser.addUser(user, proof))
          .to.emit(registryAsUser, 'UserAdded')
          .withArgs(user, tree.root)
        expect(await registryAsUser.isVerifiedUser(user)).to.equal(true)
      }
    })

    it('rejects unauthorized user', async () => {
      const user = ethers.Wallet.createRandom()
      const proof = tree.getProof(0)
      const registryAsUser = registry.connect(signers[user1.address])
      await expect(
        registryAsUser.addUser(user.address, proof)
      ).to.be.revertedWith('MerkleUserRegistry: User is not authorized')
      expect(await registryAsUser.isVerifiedUser(user.address)).to.equal(false)
    })

    it('should be able load 10k users', async function () {
      this.timeout(200000)

      const allAuthorizedUsers = Array.from(authorizedUsers)
      for (let i = 0; i < 10000; i++) {
        const randomWallet = new Wallet(utils.randomBytes(32))
        allAuthorizedUsers.push(randomWallet.address)
      }
      tree = loadUserMerkleTree(allAuthorizedUsers)
      const tx = await registry.setMerkleRoot(tree.root, 'test')
      await tx.wait()

      const registryAsUser = registry.connect(user1)
      const proof = getUserMerkleProof(user1.address, tree)
      await expect(registryAsUser.addUser(user1.address, proof))
        .to.emit(registryAsUser, 'UserAdded')
        .withArgs(user1.address, tree.root)
      expect(await registryAsUser.isVerifiedUser(user1.address)).to.equal(true)
    })
  })
})
