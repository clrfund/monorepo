import { ethers, waffle } from 'hardhat'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Contract, providers, utils } from 'ethers'
import { ZERO_ADDRESS } from '../utils/constants'

use(solidity)

const verifier = ethers.Wallet.createRandom()
const signingKey = new utils.SigningKey(verifier.privateKey)

const context = utils.formatBytes32String('clrfund-goerli')
const verificationHash =
  '0xc99d46ae8baaa7ed2766cbf34e566de43decc2ff7d8e3da5cb80e72f3b5e20de'

type Verification = {
  appUserId: string
  sig: {
    r: string
    s: string
    v: number
  }
  timestamp: number
  verificationHash: string
}

async function getBlockTimestamp(
  provider: providers.Provider
): Promise<number> {
  const blockNumber = await provider.getBlockNumber()
  const block = await provider.getBlock(blockNumber)
  return block.timestamp
}

function generateVerification(
  appUserId: string,
  timestamp: number,
  anotherSigner?: utils.SigningKey
): Verification {
  const message = utils.solidityKeccak256(
    ['bytes32', 'address', 'bytes32', 'uint256'],
    [context, appUserId, verificationHash, timestamp]
  )
  const sig = anotherSigner
    ? anotherSigner.signDigest(message)
    : signingKey.signDigest(message)

  return {
    appUserId,
    sig,
    timestamp,
    verificationHash,
  }
}

function register(registry: Contract, verification: Verification) {
  return registry.register(
    context,
    verification.appUserId,
    verification.verificationHash,
    verification.timestamp,
    verification.sig.v,
    verification.sig.r,
    verification.sig.s
  )
}

describe('BrightId User Registry', () => {
  const provider = waffle.provider
  const [, deployer, user] = provider.getWallets()

  let registry: Contract
  let sponsor: Contract

  beforeEach(async () => {
    const BrightIdSponsor = await ethers.getContractFactory(
      'BrightIdSponsor',
      deployer
    )
    sponsor = await BrightIdSponsor.deploy()

    const BrightIdUserRegistry = await ethers.getContractFactory(
      'BrightIdUserRegistry',
      deployer
    )
    registry = await BrightIdUserRegistry.deploy(
      context,
      verifier.address,
      sponsor.address
    )
  })

  describe('registration period not set', () => {
    it('rejects registration', async () => {
      const timestamp = await getBlockTimestamp(provider)
      const verification = generateVerification(user.address, timestamp)
      await expect(register(registry, verification)).to.be.revertedWith(
        'REGISTRATION CLOSED'
      )
    })
    it('isVerifiedUser returns false', async () => {
      expect(await registry.isVerifiedUser(deployer.address)).to.equal(false)
    })
  })

  it('reject invalid registration period', async () => {
    await expect(registry.setRegistrationPeriod(3, 2)).to.be.revertedWith(
      'INVALID REGISTRATION PERIOD'
    )
  })
  it('reject invalid verifier', async () => {
    await expect(
      registry.setSettings(context, ZERO_ADDRESS)
    ).to.be.revertedWith('INVALID VERIFIER')
  })
  it('reject invalid sponsor', async () => {
    await expect(registry.setSponsor(ZERO_ADDRESS)).to.be.revertedWith(
      'INVALID SPONSOR'
    )
  })

  it('allows valid settings', async () => {
    await expect(registry.setSettings(context, verifier.address))
      .to.emit(registry, 'SetBrightIdSettings')
      .withArgs(context, verifier.address)
  })

  it('allows valid sponsor', async () => {
    await expect(registry.setSponsor(sponsor.address))
      .to.emit(registry, 'SponsorChanged')
      .withArgs(sponsor.address)
  })

  it('allows valid registration period', async () => {
    await expect(registry.setRegistrationPeriod(1, 2))
      .to.emit(registry, 'RegistrationPeriodChanged')
      .withArgs(1, 2)
  })

  describe('registration', () => {
    let blockTimestamp: number
    let invalidTimestamp: number
    let deadline: number

    beforeEach(async () => {
      const blockNumber = await provider.getBlockNumber()
      const block = await provider.getBlock(blockNumber)
      invalidTimestamp = block.timestamp + 1
      const startTime = block.timestamp + 2
      blockTimestamp = block.timestamp + 5
      deadline = startTime + 500
      const tx = await registry.setRegistrationPeriod(startTime, deadline)
      await tx.wait()
    })

    describe('canRegister', () => {
      it('returns true for valid timestamp', async () => {
        await expect(await registry.canRegister(blockTimestamp)).to.equal(true)
      })

      it('returns false for invalid timestamp', async () => {
        await expect(await registry.canRegister(invalidTimestamp)).to.equal(
          false
        )
      })
    })

    it('allows valid verified user to register', async () => {
      const verification = generateVerification(user.address, blockTimestamp)
      expect(await registry.isVerifiedUser(user.address)).to.equal(false)
      await expect(register(registry, verification))
        .to.emit(registry, 'Registered')
        .withArgs(user.address, verification.timestamp)

      expect(await registry.isVerifiedUser(user.address)).to.equal(true)
    })

    it('rejects older verifications', async () => {
      expect(await registry.isVerifiedUser(user.address)).to.equal(false)
      const oldTime = blockTimestamp
      const newTime = blockTimestamp + 1
      const oldVerification = generateVerification(user.address, oldTime)
      const newVerification = generateVerification(user.address, newTime)
      await expect(register(registry, newVerification))
        .to.emit(registry, 'Registered')
        .withArgs(user.address, newVerification.timestamp)

      await expect(register(registry, oldVerification)).to.be.revertedWith(
        'NEWER VERIFICATION REGISTERED BEFORE'
      )

      expect(await registry.isVerifiedUser(user.address)).to.equal(true)
    })

    it('rejects invalid verifications', async () => {
      const timestamp = blockTimestamp
      const signer = new utils.SigningKey(user.privateKey)
      const verification = generateVerification(user.address, timestamp, signer)
      await expect(register(registry, verification)).to.be.revertedWith(
        'NOT AUTHORIZED'
      )
    })

    it('rejects verifications after deadline', async () => {
      const verification = generateVerification(user.address, deadline + 1)
      await expect(register(registry, verification)).to.be.revertedWith(
        'EXPIRED VERIFICATION'
      )
    })

    it('rejects invalid context', async () => {
      const verification = generateVerification(user.address, blockTimestamp)
      const tx = await registry.setSettings(
        utils.formatBytes32String('invalid'),
        verifier.address
      )
      await tx.wait()
      await expect(register(registry, verification)).to.be.revertedWith(
        'INVALID CONTEXT'
      )
    })
  })
})
