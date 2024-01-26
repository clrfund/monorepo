import { ethers } from 'hardhat'
import { expect } from 'chai'
import { Contract } from 'ethers'

import { ZERO_ADDRESS } from '../utils/constants'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'

describe('Simple User Registry', () => {
  let registry: Contract
  let user: HardhatEthersSigner

  beforeEach(async () => {
    let deployer: HardhatEthersSigner
    ;[, deployer, user] = await ethers.getSigners()

    const SimpleUserRegistry = await ethers.getContractFactory(
      'SimpleUserRegistry',
      deployer
    )
    registry = await SimpleUserRegistry.deploy()
  })

  describe('managing verified users', () => {
    it('allows owner to add user to the registry', async () => {
      expect(await registry.isVerifiedUser(user.address)).to.equal(false)
      await expect(registry.addUser(user.address))
        .to.emit(registry, 'UserAdded')
        .withArgs(user.address)
      expect(await registry.isVerifiedUser(user.address)).to.equal(true)
    })

    it('rejects zero-address', async () => {
      await expect(registry.addUser(ZERO_ADDRESS)).to.be.revertedWith(
        'UserRegistry: User address is zero'
      )
    })

    it('rejects user who is already in the registry', async () => {
      await registry.addUser(user.address)
      await expect(registry.addUser(user.address)).to.be.revertedWith(
        'UserRegistry: User already verified'
      )
    })

    it('allows only owner to add users', async () => {
      const registryAsUser = registry.connect(user) as Contract
      await expect(registryAsUser.addUser(user.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })

    it('allows owner to remove user', async () => {
      await registry.addUser(user.address)
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
      await registry.addUser(user.address)
      const registryAsUser = registry.connect(user) as Contract
      await expect(registryAsUser.removeUser(user.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
  })
})
