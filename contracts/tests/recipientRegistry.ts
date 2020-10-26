import { ethers, waffle } from '@nomiclabs/buidler'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Contract } from 'ethers'

import { ZERO_ADDRESS } from '../utils/constants'

use(solidity)

const MAX_RECIPIENTS = 15

describe('Simple Recipient Registry', () => {
  const provider = waffle.provider
  const [, deployer, controller, recipient] = provider.getWallets()

  let registry: Contract

  beforeEach(async () => {
    const SimpleRecipientRegistry = await ethers.getContractFactory('SimpleRecipientRegistry', deployer)
    registry = await SimpleRecipientRegistry.deploy()
  })

  describe('initializing and configuring', () => {
    it('initializes correctly', async () => {
      expect(await registry.controller()).to.equal(ZERO_ADDRESS)
      expect(await registry.maxRecipients()).to.equal(0)
    })

    it('sets controller', async () => {
      await registry.connect(controller).setController()
      expect(await registry.controller()).to.equal(controller.address)
    })

    it('reverts if controller is already set', async () => {
      await registry.connect(controller).setController()
      await expect(registry.setController())
        .to.be.revertedWith('RecipientRegistry: Controller is already set')
    })

    it('sets max number of recipients', async () => {
      await registry.connect(controller).setController()
      const maxRecipients = 255
      await registry.connect(controller).setMaxRecipients(maxRecipients)
      expect(await registry.maxRecipients()).to.equal(maxRecipients)
    })

    it('rejects attempt to set max number of recipients from anyone except controller', async () => {
      await registry.connect(controller).setController()
      await expect(registry.setMaxRecipients(255))
        .to.be.revertedWith('RecipientRegistry: Only controller can increase recipient limit')
    })
  })

  describe('managing recipients', () => {
    let recipientAddress: string
    let metadata: string

    beforeEach(async () => {
      await registry.connect(controller).setController()
      await registry.connect(controller).setMaxRecipients(MAX_RECIPIENTS)
      recipientAddress = recipient.address
      metadata = JSON.stringify({ name: 'Recipient', description: 'Description', imageHash: 'Ipfs imageHash' })
    })

    async function getCurrentBlockNumber(): Promise<number> {
      return (await provider.getBlock('latest')).number
    }

    it('allows owner to add recipient', async () => {
      await expect(registry.addRecipient(recipientAddress, metadata))
        .to.emit(registry, 'RecipientAdded')
        .withArgs(recipientAddress, metadata, 1)
      const blockNumber = await getCurrentBlockNumber()
      expect(await registry.getRecipientIndex(recipientAddress, blockNumber)).to.equal(1)

      const anotherRecipientAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      // Should increase recipient index for every new recipient
      await expect(registry.addRecipient(anotherRecipientAddress, metadata))
        .to.emit(registry, 'RecipientAdded')
        .withArgs(anotherRecipientAddress, metadata, 2)
    })

    it('rejects attempts to add recipient from anyone except owner', async () => {
      const registryAsRecipient = registry.connect(recipient)
      await expect(registryAsRecipient.addRecipient(recipientAddress, metadata))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should not add recipient if limit is not set', async () => {
      await registry.connect(controller).setMaxRecipients(0)
      await expect(registry.addRecipient(recipientAddress, metadata))
        .to.be.revertedWith('RecipientRegistry: Recipient limit is not set')
    })

    it('should not accept zero-address as recipient address', async () => {
      recipientAddress = ZERO_ADDRESS
      await expect(registry.addRecipient(recipientAddress, metadata))
        .to.be.revertedWith('RecipientRegistry: Recipient address is zero')
    })

    it('should not accept empty string as recipient metadata', async () => {
      metadata = ''
      await expect(registry.addRecipient(recipientAddress, metadata))
        .to.be.revertedWith('RecipientRegistry: Metadata info is empty string')
    })

    it('should not add already registered recipient', async () => {
      await registry.addRecipient(recipientAddress, metadata)
      metadata = JSON.stringify({ name: 'Recipient 2', description: 'Description 2', imageHash: 'Ipfs imageHash 2' })
      await expect(registry.addRecipient(recipientAddress, metadata))
        .to.be.revertedWith('RecipientRegistry: Recipient already registered')
    })

    it('should limit the number of recipients', async () => {
      let recipientName
      for (let i = 0; i < MAX_RECIPIENTS + 1; i++) {
        recipientName = String(i + 1).padStart(4, '0')
        metadata = JSON.stringify({ name: recipientName, description: 'Description', imageHash: 'Ipfs imageHash' })
        recipientAddress = `0x000000000000000000000000000000000000${recipientName}`
        if (i < MAX_RECIPIENTS) {
          await registry.addRecipient(recipientAddress, metadata)
        } else {
          await expect(registry.addRecipient(recipientAddress, metadata))
            .to.be.revertedWith('RecipientRegistry: Recipient limit reached')
        }
      }
    })

    it('allows owner to remove recipient', async () => {
      await registry.addRecipient(recipientAddress, metadata)
      await expect(registry.removeRecipient(recipientAddress))
        .to.emit(registry, 'RecipientRemoved')
        .withArgs(recipientAddress)
      const blockNumber = await getCurrentBlockNumber()
      expect(await registry.getRecipientIndex(recipientAddress, blockNumber)).to.equal(0)
    })

    it('rejects attempts to remove recipient from anyone except owner', async () => {
      const registryAsRecipient = registry.connect(recipient)
      await expect(registryAsRecipient.removeRecipient(recipientAddress))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should not remove already removed recipient', async () => {
      await registry.addRecipient(recipientAddress, metadata)
      await registry.removeRecipient(recipientAddress)
      await expect(registry.removeRecipient(recipientAddress))
        .to.be.revertedWith('RecipientRegistry: Recipient already removed')
    })

    it('should not return recipient index for unregistered recipient', async () => {
      recipientAddress = ZERO_ADDRESS
      const blockNumber = await getCurrentBlockNumber()
      expect(await registry.getRecipientIndex(recipientAddress, blockNumber)).to.equal(0)
    })

    it('should not return recipient index for recipient that has been added after given timestamp', async () => {
      const timestamp = await getCurrentBlockNumber()
      await provider.send('evm_increaseTime', [1000])
      await registry.addRecipient(recipientAddress, metadata)
      expect(await registry.getRecipientIndex(recipientAddress, timestamp)).to.equal(0)
    })

    it('should return recipient index for recipient that has been removed after given timestamp', async () => {
      await registry.addRecipient(recipientAddress, metadata)
      const addedAt = await getCurrentBlockNumber()
      await provider.send('evm_increaseTime', [1000])
      await registry.removeRecipient(recipientAddress)
      expect(await registry.getRecipientIndex(recipientAddress, addedAt)).to.equal(1)
    })

    it('allows to re-use index of removed recipient', async () => {
      await registry.addRecipient(recipientAddress, metadata)
      const blockNumber1 = await getCurrentBlockNumber()
      await registry.removeRecipient(recipientAddress)
      const otherRecipientAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      await registry.addRecipient(otherRecipientAddress, metadata)
      const anotherRecipientAddress = '0xef9e07C93b40681F6a63085Cf276aBA3D868Ac6E'
      await registry.addRecipient(anotherRecipientAddress, metadata)
      const blockNumber2 = await getCurrentBlockNumber()

      expect(await registry.getRecipientIndex(recipientAddress, blockNumber1)).to.equal(1)
      expect(await registry.getRecipientIndex(recipientAddress, blockNumber2)).to.equal(0)
      expect(await registry.getRecipientIndex(otherRecipientAddress, blockNumber1)).to.equal(0)
      expect(await registry.getRecipientIndex(otherRecipientAddress, blockNumber2)).to.equal(1)
      expect(await registry.getRecipientIndex(anotherRecipientAddress, blockNumber1)).to.equal(0)
      expect(await registry.getRecipientIndex(anotherRecipientAddress, blockNumber2)).to.equal(2)
    })
  })
})
