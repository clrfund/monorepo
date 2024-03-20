import { ethers } from 'hardhat'
import { expect } from 'chai'
import { Contract, Wallet } from 'ethers'

import { ZERO_ADDRESS } from '../utils/constants'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'

describe('Semaphore User Registry', () => {
  let registry: Contract
  let user: HardhatEthersSigner

  beforeEach(async () => {
    let deployer: HardhatEthersSigner
    ;[, deployer, user] = await ethers.getSigners()

    const SemaphoreUserRegistry = await ethers.getContractFactory(
      'SemaphoreUserRegistry',
      deployer
    )
    registry = await SemaphoreUserRegistry.deploy()
  })

  describe('managing verified users', () => {
    it('allows owner to add user to the registry', async () => {
      const semaphoreId = 1
      expect(await registry.isVerifiedUser(user.address)).to.equal(false)
      await expect(registry.addUser(user.address, semaphoreId))
        .to.emit(registry, 'UserAdded')
        .withArgs(user.address, semaphoreId)
      expect(await registry.isVerifiedUser(user.address)).to.equal(true)
    })

    it('rejects zero-address', async () => {
      const semaphoreId = 1
      await expect(
        registry.addUser(ZERO_ADDRESS, semaphoreId)
      ).to.be.revertedWith('UserRegistry: User address is zero')
    })

    it('rejects zero semphoreId', async () => {
      const semaphoreId = 0
      await expect(
        registry.addUser(user.address, semaphoreId)
      ).to.be.revertedWith('UserRegistry: Semaphore Id is zero')
    })

    it('rejects user who is already in the registry', async () => {
      const semaphoreId = 1
      await registry.addUser(user.address, semaphoreId)
      await expect(
        registry.addUser(user.address, semaphoreId)
      ).to.be.revertedWith('UserRegistry: User already verified')
    })

    it('rejects semphoreId that is already in the registry', async () => {
      const semaphoreId = 1
      const anotherUser = Wallet.createRandom()
      await registry.addUser(user.address, semaphoreId)
      await expect(
        registry.addUser(anotherUser.address, semaphoreId)
      ).to.be.revertedWith('UserRegistry: Semaphore Id already registered')
    })

    it('allows only owner to add users', async () => {
      const semaphoreId = 1
      const registryAsUser = registry.connect(user) as Contract
      await expect(
        registryAsUser.addUser(user.address, semaphoreId)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('allows owner to remove user', async () => {
      const semaphoreId = 1
      await registry.addUser(user.address, semaphoreId)
      await expect(registry.removeUser(user.address))
        .to.emit(registry, 'UserRemoved')
        .withArgs(user.address)
      expect(await registry.isVerifiedUser(user.address)).to.equal(false)
    })

    it('reverts when trying to remove user who is not in the registry', async () => {
      await expect(registry.removeUser(user.address)).to.be.revertedWith(
        'UserRegistry: User is not in the registry'
      )
    })

    it('allows only owner to remove users', async () => {
      const semaphoreId = 1
      await registry.addUser(user.address, semaphoreId)
      const registryAsUser = registry.connect(user) as Contract
      await expect(registryAsUser.removeUser(user.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })

    it('checks valid semaphoreId', async () => {
      const semaphoreId = 1
      await registry.addUser(user.address, semaphoreId)
      const isVerified = await registry.isVerifiedSemaphoreId(semaphoreId)
      expect(isVerified).to.be.true
    })

    it('checks invalid semaphoreId', async () => {
      const semaphoreId = 1
      await registry.addUser(user.address, semaphoreId)
      const isVerified = await registry.isVerifiedSemaphoreId(3)
      expect(isVerified).to.be.false
    })
  })
})
