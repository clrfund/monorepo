import { Contract } from 'ethers'
import { task } from 'hardhat/config'

const SUCCESS = 'success'

type Result = {
  name: string
  status: string
}

async function verifyMaciFactory(factory: Contract, run: any): Promise<string> {
  try {
    const address = await factory.maciFactory()
    await run('verify-maci-factory', { address })
    return SUCCESS
  } catch (error) {
    return error.message
  }
}

async function verifyRoundFactory(address: string, run: any): Promise<string> {
  try {
    await run('verify-round-factory', { address })
    return SUCCESS
  } catch (error) {
    return error.message
  }
}

async function verifyRecipientRegistry(
  factory: Contract,
  run: any
): Promise<string> {
  try {
    const address = await factory.recipientRegistry()
    await run('verify-recipient-registry', { address })
    return SUCCESS
  } catch (error) {
    return error.message
  }
}

async function verifyUserRegistry(
  factory: Contract,
  run: any
): Promise<string> {
  try {
    const address = await factory.userRegistry()
    await run('verify-user-registry', { address })
    return SUCCESS
  } catch (error) {
    return error.message
  }
}

async function verifyRound(address: string, run: any): Promise<string> {
  try {
    await run('verify-round', { address })
    return SUCCESS
  } catch (error) {
    return error.message
  }
}

async function verifyMaci(maciAddress: string, run: any): Promise<string> {
  try {
    await run('verify-maci', { maciAddress })
    return SUCCESS
  } catch (error) {
    return error.message
  }
}

async function verifyStateTreeVerifier(
  maciAddress: string,
  run: any,
  ethers: any
): Promise<string> {
  try {
    const rawAddress = await ethers.provider.getStorageAt(maciAddress, 1)
    const address = ethers.utils.hexDataSlice(rawAddress, 12)
    await run('verify:verify', { address })
    return SUCCESS
  } catch (error) {
    return error.message
  }
}

async function verifyTallyVerifier(
  maciAddress: string,
  run: any,
  ethers: any
): Promise<string> {
  try {
    const rawAddress = await ethers.provider.getStorageAt(maciAddress, 2)
    const address = ethers.utils.hexDataSlice(rawAddress, 12)
    await run('verify:verify', { address })
    return SUCCESS
  } catch (error) {
    return error.message
  }
}

async function verifySponsor(address: string, run: any): Promise<string> {
  try {
    await run('verify:verify', { address })
    return SUCCESS
  } catch (error) {
    return error.message
  }
}

async function getBrightIdSponsor(
  factory: Contract,
  ethers: any
): Promise<string | null> {
  const userRegistryAddress = await factory.userRegistry()
  const userRegistry = await ethers.getContractAt(
    'BrightIdUserRegistry',
    userRegistryAddress
  )
  try {
    const sponsor = await userRegistry.brightIdSponsor()
    return sponsor
  } catch {
    return null
  }
}

/**
 * Verifies all the contracts created for clrfund app
 */
task('verify-all', 'Verify all clrfund contracts')
  .addPositionalParam('address', 'Funding round factory contract address')
  .setAction(async ({ address }, { run, ethers }) => {
    const factory = await ethers.getContractAt('FundingRoundFactory', address)
    const roundAddress = await factory.getCurrentRound()

    const results: Result[] = []
    let status = await verifyMaciFactory(factory, run)
    results.push({ name: 'Maci facotry', status })
    status = await verifyRoundFactory(address, run)
    results.push({ name: 'Funding round factory', status })
    status = await verifyRecipientRegistry(factory, run)
    results.push({ name: 'Recipient registry', status })
    status = await verifyUserRegistry(factory, run)
    results.push({ name: 'User factory', status })

    const sponsor = await getBrightIdSponsor(factory, ethers)
    if (sponsor) {
      status = await verifySponsor(sponsor, run)
      results.push({ name: 'BrightId sponsor', status })
    }

    if (roundAddress !== ethers.constants.AddressZero) {
      const round = await ethers.getContractAt('FundingRound', roundAddress)
      const maciAddress = await round.maci()
      status = await verifyRound(roundAddress, run)
      results.push({ name: 'Funding round', status })
      status = await verifyMaci(maciAddress, run)
      results.push({ name: 'MACI', status })

      status = await verifyStateTreeVerifier(maciAddress, run, ethers)
      results.push({ name: 'BatchUpdateStateTreeVerifier', status })

      status = await verifyTallyVerifier(maciAddress, run, ethers)
      results.push({ name: 'QuadVoteTallyVerifier', status })
    }

    results.forEach(({ name, status }, i) => {
      const color = status === SUCCESS ? '32' : '31'
      console.log(`${i} ${name}: \x1b[%sm%s\x1b[0m`, color, status)
    })
  })
