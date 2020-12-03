import { ethers, waffle } from '@nomiclabs/buidler'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Contract } from 'ethers'
import { keccak256 } from '@ethersproject/solidity'
import { gtcrEncode } from '@kleros/gtcr-encoder'

import { ZERO_ADDRESS } from '../utils/constants'

use(solidity)

const { provider } = waffle
const MAX_RECIPIENTS = 15

async function getCurrentBlockNumber(): Promise<number> {
  return (await provider.getBlock('latest')).number
}

describe('Simple Recipient Registry', () => {
  const [, deployer, controller, recipient] = provider.getWallets()

  let registry: Contract

  beforeEach(async () => {
    const SimpleRecipientRegistry = await ethers.getContractFactory('SimpleRecipientRegistry', deployer)
    registry = await SimpleRecipientRegistry.deploy(controller.address)
  })

  describe('initializing and configuring', () => {
    it('initializes correctly', async () => {
      expect(await registry.controller()).to.equal(controller.address)
      expect(await registry.maxRecipients()).to.equal(0)
    })

    it('sets max number of recipients', async () => {
      await registry.connect(controller).setMaxRecipients(MAX_RECIPIENTS)
      expect(await registry.maxRecipients()).to.equal(MAX_RECIPIENTS)
    })

    it('reverts if given number is less than current limit', async () => {
      await registry.connect(controller).setMaxRecipients(MAX_RECIPIENTS)
      await expect(registry.connect(controller).setMaxRecipients(1))
        .to.be.revertedWith('RecipientRegistry: Max number of recipients can not be decreased')
    })

    it('ignores attempt to set max number of recipients from anyone except controller', async () => {
      await registry.setMaxRecipients(MAX_RECIPIENTS)
      expect(await registry.maxRecipients()).to.equal(0)
    })

    it('should not add recipient if limit is not set', async () => {
      await expect(registry.addRecipient(recipient.address, JSON.stringify({})))
        .to.be.revertedWith('RecipientRegistry: Recipient limit is not set')
    })
  })

  describe('managing recipients', () => {
    const recipientIndex = 1
    let recipientAddress: string
    let metadata: string

    beforeEach(async () => {
      await registry.connect(controller).setMaxRecipients(MAX_RECIPIENTS)
      recipientAddress = recipient.address
      metadata = JSON.stringify({ name: 'Recipient', description: 'Description', imageHash: 'Ipfs imageHash' })
    })

    it('allows owner to add recipient', async () => {
      await expect(registry.addRecipient(recipientAddress, metadata))
        .to.emit(registry, 'RecipientAdded')
        .withArgs(recipientAddress, metadata, recipientIndex)
      const currentBlock = await getCurrentBlockNumber()
      expect(await registry.getRecipientAddress(
        recipientIndex, currentBlock, currentBlock,
      )).to.equal(recipientAddress)

      const anotherRecipientAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      // Should increase recipient index for every new recipient
      await expect(registry.addRecipient(anotherRecipientAddress, metadata))
        .to.emit(registry, 'RecipientAdded')
        .withArgs(anotherRecipientAddress, metadata, recipientIndex + 1)
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
      expect(await registry.getRecipientAddress(
        recipientIndex, currentBlock, currentBlock,
      )).to.equal(ZERO_ADDRESS)
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

    it('should not return recipient address for recipient that has been added after the end of round', async () => {
      const startBlock = await getCurrentBlockNumber()
      await provider.send('evm_increaseTime', [1000])
      const endBlock = await getCurrentBlockNumber()
      await registry.addRecipient(recipientAddress, metadata)
      expect(await registry.getRecipientAddress(
        recipientIndex, startBlock, endBlock,
      )).to.equal(ZERO_ADDRESS)
    })

    it('should return recipient address for recipient that has been removed after the beginning of round', async () => {
      await registry.addRecipient(recipientAddress, metadata)
      const startBlock = await getCurrentBlockNumber()
      await registry.removeRecipient(recipientAddress)
      await provider.send('evm_increaseTime', [1000])
      const endBlock = await getCurrentBlockNumber()
      expect(await registry.getRecipientAddress(
        recipientIndex, startBlock, endBlock,
      )).to.equal(recipientAddress)
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
      expect(await registry.getRecipientAddress(
        1, blockNumber1, blockNumber2,
      )).to.equal(removedRecipient1)
      expect(await registry.getRecipientAddress(
        2, blockNumber1, blockNumber2,
      )).to.equal(removedRecipient2)

      await provider.send('evm_increaseTime', [1000])
      const blockNumber3 = await getCurrentBlockNumber()
      // Recipients removed before the beginning of the round should be replaced
      expect(await registry.getRecipientAddress(
        1, blockNumber2, blockNumber3,
      )).to.equal(addedRecipient2)
      expect(await registry.getRecipientAddress(
        2, blockNumber2, blockNumber3,
      )).to.equal(addedRecipient1)
    })
  })

  describe('get recipient address', () => {
    it('should return zero address for zero index', async () => {
      const currentBlock = await getCurrentBlockNumber()
      expect(await registry.getRecipientAddress(
        0, currentBlock, currentBlock,
      )).to.equal(ZERO_ADDRESS)
    })

    it('should return zero address for unregistered recipient', async () => {
      const currentBlock = await getCurrentBlockNumber()
      expect(await registry.getRecipientAddress(
        99, currentBlock, currentBlock,
      )).to.equal(ZERO_ADDRESS)
    })
  })
})

describe('Kleros GTCR adapter', () => {
  const [, deployer, controller, recipient] = provider.getWallets()
  const gtcrColumns = [{
    label: 'Name',
    description: 'Commonly recognizable name of the recipient.',
    type: 'text',
    isIdentifier: true,
  }, {
    label: 'Address',
    description: 'Recipient receiving address',
    type: 'address',
    isIdentifier: true,
  }]

  function encodeRecipient(address: string): [string, string] {
    const recipientData = gtcrEncode({
      columns: gtcrColumns,
      values: {'Name': `test-${address}`, 'Address': address},
    })
    const recipientId = keccak256(['bytes'], [recipientData])
    return [recipientId, recipientData]
  }

  let tcr: Contract
  let registry: Contract

  beforeEach(async () => {
    const KlerosGTCRMock = await ethers.getContractFactory('KlerosGTCRMock', deployer)
    tcr = await KlerosGTCRMock.deploy('/ipfs/0', '/ipfs/1')
    const KlerosGTCRAdapter = await ethers.getContractFactory('KlerosGTCRAdapter', deployer)
    registry = await KlerosGTCRAdapter.deploy(tcr.address, controller.address)
  })

  it('initializes correctly', async () => {
    expect(await registry.tcr()).to.equal(tcr.address)
    expect(await registry.controller()).to.equal(controller.address)
    expect(await registry.maxRecipients()).to.equal(0)
  })

  describe('managing recipients', () => {
    const recipientIndex = 1
    const [recipientId, recipientData] = encodeRecipient(recipient.address)

    beforeEach(async () => {
      await registry.connect(controller).setMaxRecipients(MAX_RECIPIENTS)
    })

    it('allows anyone to add recipient', async () => {
      await tcr.addItem(recipientData)
      await expect(registry.connect(recipient).addRecipient(recipientId))
        .to.emit(registry, 'RecipientAdded')
        .withArgs(recipientId, recipientData, recipientIndex)
      const currentBlock = await getCurrentBlockNumber()
      expect(await registry.getRecipientAddress(
        recipientIndex, currentBlock, currentBlock,
      )).to.equal(recipient.address)

      const anotherRecipientAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      const [anotherRecipientId, anotherRecipientData] = encodeRecipient(anotherRecipientAddress)
      await tcr.addItem(anotherRecipientData)
      // Should increase recipient index for every new recipient
      await expect(registry.connect(recipient).addRecipient(anotherRecipientId))
        .to.emit(registry, 'RecipientAdded')
        .withArgs(anotherRecipientId, anotherRecipientData, recipientIndex + 1)
    })

    it('should not accept recipient who is not registered in TCR', async () => {
      await expect(registry.addRecipient(recipientId))
        .to.be.revertedWith('RecipientRegistry: Item not found in TCR')
    })

    it('should not add already registered recipient', async () => {
      await tcr.addItem(recipientData)
      await registry.addRecipient(recipientId)
      await expect(registry.addRecipient(recipientId))
        .to.be.revertedWith('RecipientRegistry: Recipient already registered')
    })

    it('should not accept recipient with invalid metadata', async () => {
      await tcr.addItem('0xdead')
      await expect(registry.addRecipient(recipientId)).to.be.reverted
    })

    it('allows anyone to remove recipient', async () => {
      await tcr.addItem(recipientData)
      await registry.connect(recipient).addRecipient(recipientId)
      await tcr.removeItem(recipientId)
      await expect(registry.connect(recipient).removeRecipient(recipientId))
        .to.emit(registry, 'RecipientRemoved')
        .withArgs(recipientId)
      const currentBlock = await getCurrentBlockNumber()
      expect(await registry.getRecipientAddress(
        recipientIndex, currentBlock, currentBlock,
      )).to.equal(ZERO_ADDRESS)
    })

    it('should not remove already removed recipient', async () => {
      await tcr.addItem(recipientData)
      await registry.addRecipient(recipientId)
      await tcr.removeItem(recipientId)
      await registry.removeRecipient(recipientId)
      await expect(registry.removeRecipient(recipientId))
        .to.be.revertedWith('RecipientRegistry: Recipient already removed')
    })

    it('should not remove removed recipient who has not been removed from TCR', async () => {
      await tcr.addItem(recipientData)
      await registry.addRecipient(recipientId)
      await expect(registry.removeRecipient(recipientId))
        .to.be.revertedWith('RecipientRegistry: Item is not removed from TCR')
    })
  })

  describe('get recipient address', () => {
    async function addRecipient(address: string) {
      const [recipientId, recipientData] = encodeRecipient(address)
      await tcr.addItem(recipientData)
      return await registry.addRecipient(recipientId)
    }

    async function removeRecipient(address: string) {
      const [recipientId] = encodeRecipient(address)
      await tcr.removeItem(recipientId)
      return await registry.removeRecipient(recipientId)
    }

    beforeEach(async () => {
      await registry.connect(controller).setMaxRecipients(MAX_RECIPIENTS)
    })

    it('allows to re-use index of removed recipient', async () => {
      // Add recipients up to a limit
      for (let i = 0; i < MAX_RECIPIENTS; i++) {
        const recipientName = String(i + 1).padStart(4, '0')
        const recipientAddress = `0x100000000000000000000000000000000000${recipientName}`
        await addRecipient(recipientAddress)
      }
      const blockNumber1 = await getCurrentBlockNumber()

      // Replace recipients
      const removedRecipient1 = '0x1000000000000000000000000000000000000001'
      const removedRecipient2 = '0x1000000000000000000000000000000000000002'
      await removeRecipient(removedRecipient1)
      await removeRecipient(removedRecipient2)
      const addedRecipient1 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      const addedRecipient2 = '0xef9e07C93b40681F6a63085Cf276aBA3D868Ac6E'
      const addedRecipient3 = '0x927be3E75380CC412148AfE80d9e9D02fF488738'
      await addRecipient(addedRecipient1)
      await addRecipient(addedRecipient2)
      await expect(addRecipient(addedRecipient3))
        .to.be.revertedWith('RecipientRegistry: Recipient limit reached')
      const blockNumber2 = await getCurrentBlockNumber()

      // Recipients removed during the round should still be valid
      expect(await registry.getRecipientAddress(
        1, blockNumber1, blockNumber2,
      )).to.equal(removedRecipient1)
      expect(await registry.getRecipientAddress(
        2, blockNumber1, blockNumber2,
      )).to.equal(removedRecipient2)

      await provider.send('evm_increaseTime', [1000])
      const blockNumber3 = await getCurrentBlockNumber()
      // Recipients removed before the beginning of the round should be replaced
      expect(await registry.getRecipientAddress(
        1, blockNumber2, blockNumber3,
      )).to.equal(addedRecipient2)
      expect(await registry.getRecipientAddress(
        2, blockNumber2, blockNumber3,
      )).to.equal(addedRecipient1)
    })
  })
})
