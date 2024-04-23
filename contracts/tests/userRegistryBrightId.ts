import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  Wallet,
  Contract,
  SigningKey,
  encodeBytes32String,
  solidityPackedKeccak256,
} from 'ethers'
import { ZERO_ADDRESS } from '../utils/constants'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'

const verifier = Wallet.createRandom()
const context = encodeBytes32String('clrfund-goerli')
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

async function generateVerification(
  appUserId: string,
  timestamp: number,
  anotherSigner?: SigningKey
): Promise<Verification> {
  const message = solidityPackedKeccak256(
    ['bytes32', 'address', 'bytes32', 'uint256'],
    [context, appUserId, verificationHash, timestamp]
  )

  const signer = anotherSigner ?? verifier.signingKey
  const sig = await signer.sign(message)

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

describe('BrightId User Registry', async () => {
  let registry: Contract
  let sponsor: Contract
  let user: HardhatEthersSigner
  let sponsorAddress: string

  before(async () => {
    ;[, , user] = await ethers.getSigners()
  })

  beforeEach(async () => {
    const [, deployer] = await ethers.getSigners()
    const BrightIdSponsor = await ethers.getContractFactory(
      'BrightIdSponsor',
      deployer
    )
    sponsor = await BrightIdSponsor.deploy()
    sponsorAddress = await sponsor.getAddress()

    const BrightIdUserRegistry = await ethers.getContractFactory(
      'BrightIdUserRegistry',
      deployer
    )
    registry = await BrightIdUserRegistry.deploy(
      context,
      verifier.address,
      sponsorAddress
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
    await expect(registry.setSponsor(sponsorAddress))
      .to.emit(registry, 'SponsorChanged')
      .withArgs(sponsorAddress)
  })

  describe('registration', () => {
    let blockTimestamp: number
    beforeEach(async () => {
      blockTimestamp = await time.latest()
    })

    it('allows valid verified user to register', async () => {
      const verification = await generateVerification(
        user.address,
        blockTimestamp
      )
      expect(await registry.isVerifiedUser(user.address)).to.equal(false)
      await expect(register(registry, verification))
        .to.emit(registry, 'Registered')
        .withArgs(user.address, verification.timestamp)

      expect(await registry.isVerifiedUser(user.address)).to.equal(true)
    })

    it('rejects verifications with 0 timestamp', async () => {
      const verification = await generateVerification(user.address, 0)
      await expect(register(registry, verification)).to.be.revertedWith(
        'NEWER VERIFICATION REGISTERED BEFORE'
      )
    })

    it('rejects older verifications', async () => {
      expect(await registry.isVerifiedUser(user.address)).to.equal(false)
      const oldTime = blockTimestamp
      const newTime = blockTimestamp + 1
      const oldVerification = await generateVerification(user.address, oldTime)
      const newVerification = await generateVerification(user.address, newTime)
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
      const anotherSigner = Wallet.createRandom()

      const verification = await generateVerification(
        user.address,
        timestamp,
        anotherSigner.signingKey
      )
      await expect(register(registry, verification)).to.be.revertedWith(
        'NOT AUTHORIZED'
      )
    })

    it('rejects invalid context', async () => {
      const verification = await generateVerification(
        user.address,
        blockTimestamp
      )
      const tx = await registry.setSettings(
        encodeBytes32String('invalid'),
        verifier.address
      )
      await tx.wait()
      await expect(register(registry, verification)).to.be.revertedWith(
        'INVALID CONTEXT'
      )
    })
  })
})
