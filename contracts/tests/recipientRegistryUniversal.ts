import { ethers, waffle } from 'hardhat'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumber, Contract, utils } from 'ethers'

import { UNIT, ZERO_ADDRESS } from '../utils/constants'
import { getTxFee } from '../utils/contracts'
import { deployContract } from '../utils/deployment'

use(solidity)

const { provider } = waffle

const MAX_RECIPIENTS = 16

async function getCurrentTime(): Promise<number> {
  return (await provider.getBlock('latest')).timestamp
}

describe('Universal recipient registry', () => {
  const [, deployer, controller, recipient, requester] = provider.getWallets()
  let registry: Contract

  const baseDeposit = UNIT.div(10) // 0.1 ETH
  const challengePeriodDuration = BigNumber.from(86400) // Seconds

  enum RequestType {
    Registration = 0,
    Removal = 1,
  }

  beforeEach(async () => {
    registry = await deployContract(deployer, 'UniversalRecipientRegistry', [
      baseDeposit,
      challengePeriodDuration,
      controller.address,
    ])
  })

  it('initializes correctly', async () => {
    expect(await registry.baseDeposit()).to.equal(baseDeposit)
    expect(await registry.challengePeriodDuration()).to.equal(
      challengePeriodDuration
    )
    expect(await registry.controller()).to.equal(controller.address)
    expect(await registry.maxRecipients()).to.equal(0)
  })

  it('changes base deposit', async () => {
    const newBaseDeposit = baseDeposit.mul(2)
    await registry.setBaseDeposit(newBaseDeposit)
    expect(await registry.baseDeposit()).to.equal(newBaseDeposit)
  })

  it('changes challenge period duration', async () => {
    const newChallengePeriodDuration = challengePeriodDuration.mul(2)
    await registry.setChallengePeriodDuration(newChallengePeriodDuration)
    expect(await registry.challengePeriodDuration()).to.equal(
      newChallengePeriodDuration
    )
  })

  describe('managing recipients', () => {
    const recipientIndex = 1
    let recipientAddress: string
    let metadata: string
    let recipientId: string

    function getRecipientId(address: string, metadata: string): string {
      return utils.id(`${address}${metadata}`)
    }

    beforeEach(async () => {
      await registry.connect(controller).setMaxRecipients(MAX_RECIPIENTS)
      recipientAddress = recipient.address
      metadata = JSON.stringify({
        name: 'Recipient',
        description: 'Description',
        imageHash: 'Ipfs imageHash',
      })
      recipientId = getRecipientId(recipientAddress, metadata)
    })

    it('allows anyone to submit registration request', async () => {
      const requestSubmitted = await registry
        .connect(requester)
        .addRecipient(recipientAddress, recipientId, { value: baseDeposit })
      const currentTime = await getCurrentTime()
      expect(requestSubmitted)
        .to.emit(registry, 'RequestSubmitted')
        .withArgs(
          recipientId,
          RequestType.Registration,
          recipientAddress,
          currentTime
        )
      expect(await provider.getBalance(registry.address)).to.equal(baseDeposit)
    })

    it('should not accept zero-address as recipient address', async () => {
      recipientAddress = ZERO_ADDRESS
      await expect(
        registry.addRecipient(recipientAddress, recipientId, {
          value: baseDeposit,
        })
      ).to.be.revertedWith('RecipientRegistry: Recipient address is zero')
    })

    it('should not accept registration request if recipient is already registered', async () => {
      await registry.addRecipient(recipientAddress, recipientId, {
        value: baseDeposit,
      })
      await provider.send('evm_increaseTime', [86400])
      await registry.executeRequest(recipientId)
      await expect(
        registry.addRecipient(recipientAddress, recipientId, {
          value: baseDeposit,
        })
      ).to.be.revertedWith('RecipientRegistry: Recipient already registered')
    })

    it('should not accept new registration request if previous request is not resolved', async () => {
      await registry.addRecipient(recipientAddress, recipientId, {
        value: baseDeposit,
      })
      await expect(
        registry.addRecipient(recipientAddress, recipientId, {
          value: baseDeposit,
        })
      ).to.be.revertedWith('RecipientRegistry: Request already submitted')
    })

    it('should not accept registration request with incorrect deposit size', async () => {
      await expect(
        registry.addRecipient(recipientAddress, recipientId, {
          value: baseDeposit.div(2),
        })
      ).to.be.revertedWith('RecipientRegistry: Incorrect deposit amount')
    })

    it('allows owner to challenge registration request', async () => {
      await registry
        .connect(requester)
        .addRecipient(recipientAddress, recipientId, { value: baseDeposit })
      const requesterBalanceBefore = await provider.getBalance(
        requester.address
      )
      const requestRejected = await registry.challengeRequest(
        recipientId,
        requester.address
      )
      const currentTime = await getCurrentTime()
      expect(requestRejected)
        .to.emit(registry, 'RequestResolved')
        .withArgs(recipientId, RequestType.Registration, true, 0, currentTime)
      const requesterBalanceAfter = await provider.getBalance(requester.address)
      expect(requesterBalanceBefore.add(baseDeposit)).to.equal(
        requesterBalanceAfter
      )
    })

    it('allows owner to set beneficiary address when challenging request', async () => {
      await registry.addRecipient(recipientAddress, recipientId, {
        value: baseDeposit,
      })
      const controllerBalanceBefore = await provider.getBalance(
        controller.address
      )
      await registry.challengeRequest(recipientId, controller.address)
      const controllerBalanceAfter = await provider.getBalance(
        controller.address
      )
      expect(controllerBalanceBefore.add(baseDeposit)).to.equal(
        controllerBalanceAfter
      )
    })

    it('allows only owner to challenge requests', async () => {
      await registry
        .connect(requester)
        .addRecipient(recipientAddress, recipientId, { value: baseDeposit })
      await expect(
        registry
          .connect(requester)
          .challengeRequest(recipientId, requester.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should not allow to challenge resolved request', async () => {
      await registry
        .connect(requester)
        .addRecipient(recipientAddress, recipientId, { value: baseDeposit })
      await registry.challengeRequest(recipientId, requester.address)
      await expect(
        registry.challengeRequest(recipientId, requester.address)
      ).to.be.revertedWith('RecipientRegistry: Request does not exist')
    })

    it('allows anyone to execute unchallenged registration request', async () => {
      await registry
        .connect(requester)
        .addRecipient(recipientAddress, recipientId, { value: baseDeposit })
      await provider.send('evm_increaseTime', [86400])

      const requesterBalanceBefore = await provider.getBalance(
        requester.address
      )
      const requestExecuted = await registry
        .connect(requester)
        .executeRequest(recipientId)
      const currentTime = await getCurrentTime()
      expect(requestExecuted)
        .to.emit(registry, 'RequestResolved')
        .withArgs(
          recipientId,
          RequestType.Registration,
          false,
          recipientIndex,
          currentTime
        )
      const txFee = await getTxFee(requestExecuted)
      const requesterBalanceAfter = await provider.getBalance(requester.address)
      expect(requesterBalanceBefore.sub(txFee).add(baseDeposit)).to.equal(
        requesterBalanceAfter
      )

      expect(
        await registry.getRecipientAddress(
          recipientIndex,
          currentTime,
          currentTime
        )
      ).to.equal(recipientAddress)
    })

    it('should not allow to execute request that does not exist', async () => {
      await expect(registry.executeRequest(recipientId)).to.be.revertedWith(
        'RecipientRegistry: Request does not exist'
      )
    })

    it('should not allow non-owner to execute request during challenge period', async () => {
      await registry.addRecipient(recipientAddress, recipientId, {
        value: baseDeposit,
      })

      await expect(
        registry.connect(requester).executeRequest(recipientId)
      ).to.be.revertedWith('RecipientRegistry: Challenge period is not over')
    })

    it('should allow owner to execute request during challenge period', async () => {
      await registry.addRecipient(recipientAddress, recipientId, {
        value: baseDeposit,
      })

      let recipientCount = await registry.getRecipientCount()
      expect(recipientCount.toNumber()).to.equal(0)

      await registry.executeRequest(recipientId)

      recipientCount = await registry.getRecipientCount()
      expect(recipientCount.toNumber()).to.equal(1)
    })

    it('should remember initial deposit amount during registration', async () => {
      await registry
        .connect(requester)
        .addRecipient(recipientAddress, recipientId, { value: baseDeposit })
      await registry.setBaseDeposit(baseDeposit.mul(2))
      await provider.send('evm_increaseTime', [86400])

      const requesterBalanceBefore = await provider.getBalance(
        requester.address
      )
      const requestExecuted = await registry
        .connect(requester)
        .executeRequest(recipientId)
      const txFee = await getTxFee(requestExecuted)
      const requesterBalanceAfter = await provider.getBalance(requester.address)
      expect(requesterBalanceBefore.sub(txFee).add(baseDeposit)).to.equal(
        requesterBalanceAfter
      )
    })

    it('should limit the number of recipients', async () => {
      let recipientName
      for (let i = 0; i < MAX_RECIPIENTS + 1; i++) {
        recipientName = String(i + 1).padStart(4, '0')
        metadata = JSON.stringify({
          name: recipientName,
          description: 'Description',
          imageHash: 'Ipfs imageHash',
        })
        recipientAddress = `0x000000000000000000000000000000000000${recipientName}`
        recipientId = getRecipientId(recipientAddress, metadata)
        if (i < MAX_RECIPIENTS) {
          await registry.addRecipient(recipientAddress, recipientId, {
            value: baseDeposit,
          })
          await provider.send('evm_increaseTime', [86400])
          await registry.executeRequest(recipientId)
        } else {
          await registry.addRecipient(recipientAddress, recipientId, {
            value: baseDeposit,
          })
          await provider.send('evm_increaseTime', [86400])
          await expect(registry.executeRequest(recipientId)).to.be.revertedWith(
            'RecipientRegistry: Recipient limit reached'
          )
        }
      }
    })

    it('allows owner to submit removal request', async () => {
      await registry.addRecipient(recipientAddress, recipientId, {
        value: baseDeposit,
      })
      await provider.send('evm_increaseTime', [86400])
      await registry.executeRequest(recipientId)

      const requestSubmitted = await registry.removeRecipient(recipientId, {
        value: baseDeposit,
      })
      const currentTime = await getCurrentTime()
      expect(requestSubmitted)
        .to.emit(registry, 'RequestSubmitted')
        .withArgs(recipientId, RequestType.Removal, ZERO_ADDRESS, currentTime)
    })

    it('allows only owner to execute removal request during challenge period', async () => {
      await registry.addRecipient(recipientAddress, recipientId, {
        value: baseDeposit,
      })
      await registry.executeRequest(recipientId)

      const registryAsRequester = registry.connect(requester)
      await registryAsRequester.removeRecipient(recipientId, {
        value: baseDeposit,
      })

      await expect(
        registryAsRequester.executeRequest(recipientId)
      ).to.be.revertedWith('RecipientRegistry: Challenge period is not over')
    })

    it('should not accept removal request if recipient is not in registry', async () => {
      await expect(registry.removeRecipient(recipientId)).to.be.revertedWith(
        'RecipientRegistry: Recipient is not in the registry'
      )
    })

    it('should not accept removal request if recipient is already removed', async () => {
      await registry.addRecipient(recipientAddress, recipientId, {
        value: baseDeposit,
      })
      await provider.send('evm_increaseTime', [86400])
      await registry.executeRequest(recipientId)

      await registry.removeRecipient(recipientId, { value: baseDeposit })
      await provider.send('evm_increaseTime', [86400])
      await registry.connect(requester).executeRequest(recipientId)

      await expect(registry.removeRecipient(recipientId)).to.be.revertedWith(
        'RecipientRegistry: Recipient already removed'
      )
    })

    it('should not accept new removal request if previous removal request is not resolved', async () => {
      await registry.addRecipient(recipientAddress, recipientId, {
        value: baseDeposit,
      })
      await provider.send('evm_increaseTime', [86400])
      await registry.executeRequest(recipientId)

      await registry.removeRecipient(recipientId, { value: baseDeposit })
      await expect(registry.removeRecipient(recipientId)).to.be.revertedWith(
        'RecipientRegistry: Request already submitted'
      )
    })

    it('allows owner to challenge removal request', async () => {
      await registry.addRecipient(recipientAddress, recipientId, {
        value: baseDeposit,
      })
      await provider.send('evm_increaseTime', [86400])
      await registry.executeRequest(recipientId)

      await registry.removeRecipient(recipientId, { value: baseDeposit })
      const requestRejected = await registry.challengeRequest(
        recipientId,
        requester.address
      )
      const currentTime = await getCurrentTime()
      expect(requestRejected)
        .to.emit(registry, 'RequestResolved')
        .withArgs(recipientId, RequestType.Removal, true, 0, currentTime)

      // Recipient is not removed
      expect(
        await registry.getRecipientAddress(
          recipientIndex,
          currentTime,
          currentTime
        )
      ).to.equal(recipientAddress)
    })

    it('allows anyone to execute unchallenged removal request', async () => {
      await registry.addRecipient(recipientAddress, recipientId, {
        value: baseDeposit,
      })
      await provider.send('evm_increaseTime', [86400])
      await registry.executeRequest(recipientId)

      await registry.removeRecipient(recipientId, { value: baseDeposit })
      await provider.send('evm_increaseTime', [86400])

      const requestExecuted = await registry
        .connect(requester)
        .executeRequest(recipientId)
      const currentTime = await getCurrentTime()
      expect(requestExecuted)
        .to.emit(registry, 'RequestResolved')
        .withArgs(recipientId, RequestType.Removal, false, 0, currentTime)

      expect(
        await registry.getRecipientAddress(
          recipientIndex,
          currentTime,
          currentTime
        )
      ).to.equal(ZERO_ADDRESS)
    })
  })
})
