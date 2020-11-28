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
      await registry.setController(controller.address)
      expect(await registry.controller()).to.equal(controller.address)
    })

    it('reverts if controller is already set', async () => {
      await registry.setController(controller.address)
      await expect(registry.setController(deployer.address))
        .to.be.revertedWith('RecipientRegistry: Controller is already set')
    })

    it('allows only owner to set controller', async () => {
      await expect(registry.connect(controller).setController(controller.address))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('sets max number of recipients', async () => {
      await registry.setController(controller.address)
      await registry.connect(controller).setMaxRecipients(MAX_RECIPIENTS)
      expect(await registry.maxRecipients()).to.equal(MAX_RECIPIENTS)
    })

    it('reverts if given number is less than current limit', async () => {
      await registry.setController(controller.address)
      await registry.connect(controller).setMaxRecipients(MAX_RECIPIENTS)
      await expect(registry.connect(controller).setMaxRecipients(1))
        .to.be.revertedWith('RecipientRegistry: Max number of recipients can not be decreased')
    })

    it('ignores attempt to set max number of recipients from anyone except controller', async () => {
      await registry.setController(controller.address)
      await registry.setMaxRecipients(MAX_RECIPIENTS)
      expect(await registry.maxRecipients()).to.equal(0)
    })

    it('allows owner to set max number of recipients if controller is not set', async () => {
      await registry.setMaxRecipients(MAX_RECIPIENTS)
      expect(await registry.maxRecipients()).to.equal(MAX_RECIPIENTS)
    })

    it('rejects attempt to set max number of recipients from anyone except owner if controller is not set', async () => {
      await expect(registry.connect(controller).setMaxRecipients(MAX_RECIPIENTS))
        .to.be.revertedWith('RecipientRegistry: Only owner can act as a controller')
    })

    it('should not add recipient if limit is not set', async () => {
      await expect(registry.addRecipient(recipient.address, JSON.stringify({})))
        .to.be.revertedWith('RecipientRegistry: Recipient limit is not set')
    })
  })

  describe('managing recipients', () => {
    let recipientAddress: string
    let metadata: string

    beforeEach(async () => {
      await registry.setController(controller.address)
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
      const currentBlock = await getCurrentBlockNumber()
      expect(await registry.getRecipientIndex(
        recipientAddress, currentBlock, currentBlock,
      )).to.equal(1)

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
      const currentBlock = await getCurrentBlockNumber()
      expect(await registry.getRecipientIndex(
        recipientAddress, currentBlock, currentBlock,
      )).to.equal(0)
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
      const currentBlock = await getCurrentBlockNumber()
      expect(await registry.getRecipientIndex(
        recipientAddress, currentBlock, currentBlock,
      )).to.equal(0)
    })

    it('should not return recipient index for recipient that has been added after the end of round', async () => {
      const startBlock = await getCurrentBlockNumber()
      await provider.send('evm_increaseTime', [1000])
      const endBlock = await getCurrentBlockNumber()
      await registry.addRecipient(recipientAddress, metadata)
      expect(await registry.getRecipientIndex(
        recipientAddress, startBlock, endBlock,
      )).to.equal(0)
    })

    it('should return recipient index for recipient that has been removed after the beginning of round', async () => {
      await registry.addRecipient(recipientAddress, metadata)
      const startBlock = await getCurrentBlockNumber()
      await registry.removeRecipient(recipientAddress)
      await provider.send('evm_increaseTime', [1000])
      const endBlock = await getCurrentBlockNumber()
      expect(await registry.getRecipientIndex(
        recipientAddress, startBlock, endBlock,
      )).to.equal(1)
    })

    it('allows to re-use index of removed recipient', async () => {
      // Add recipients up to a limit
      for (let i = 0; i < MAX_RECIPIENTS; i++) {
        const recipientName = String(i + 1).padStart(4, '0')
        recipientAddress = `0x000000000000000000000000000000000000${recipientName}`
        await registry.addRecipient(recipientAddress, metadata)
      }
      const blockNumber1 = await getCurrentBlockNumber()

      // Replace recipients
      const removedRecipient1 = '0x0000000000000000000000000000000000000001'
      const removedRecipient2 = '0x0000000000000000000000000000000000000002'
      await registry.removeRecipient(removedRecipient1)
      await registry.removeRecipient(removedRecipient2)
      const addedRecipient1 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      const addedRecipient2 = '0xef9e07C93b40681F6a63085Cf276aBA3D868Ac6E'
      const addedRecipient3 = '0x927be3E75380CC412148AfE80d9e9D02fF488738'
      await registry.addRecipient(addedRecipient1, metadata)
      await registry.addRecipient(addedRecipient2, metadata)
      await expect(registry.addRecipient(addedRecipient3, metadata))
        .to.be.revertedWith('RecipientRegistry: Recipient limit reached')
      const blockNumber2 = await getCurrentBlockNumber()

      // Recipients removed during the round should still be valid
      expect(await registry.getRecipientIndex(
        removedRecipient1, blockNumber1, blockNumber2,
      )).to.equal(1)
      expect(await registry.getRecipientIndex(
        removedRecipient2, blockNumber1, blockNumber2,
      )).to.equal(2)
      expect(await registry.getRecipientIndex(
        addedRecipient1, blockNumber1, blockNumber2,
      )).to.equal(0)
      expect(await registry.getRecipientIndex(
        addedRecipient2, blockNumber1, blockNumber2,
      )).to.equal(0)

      await provider.send('evm_increaseTime', [1000])
      const blockNumber3 = await getCurrentBlockNumber()
      // Recipients removed before the beginning of the round should be replaced
      expect(await registry.getRecipientIndex(
        removedRecipient1, blockNumber2, blockNumber3,
      )).to.equal(0)
      expect(await registry.getRecipientIndex(
        removedRecipient2, blockNumber2, blockNumber3,
      )).to.equal(0)
      expect(await registry.getRecipientIndex(
        addedRecipient1, blockNumber2, blockNumber3,
      )).to.equal(2)
      expect(await registry.getRecipientIndex(
        addedRecipient2, blockNumber2, blockNumber3,
      )).to.equal(1)
    })
  })
})
