import { Contract } from 'ethers'
import { task } from 'hardhat/config'
import { ZERO_ADDRESS } from '../utils/constants'

const SUCCESS = 'success'

type Result = {
  name: string
  status: string
}

async function verifyDeployer(deployer: Contract, run: any): Promise<string> {
  try {
    const constructorArguments = await Promise.all([
      deployer.clrfundTemplate(),
      deployer.maciFactory(),
      deployer.roundFactory(),
    ])

    await run('verify:verify', {
      address: deployer.target,
      constructorArguments,
    })
    return SUCCESS
  } catch (error) {
    return (error as Error).message
  }
}

async function verifyMaciFactory(
  deployer: Contract,
  run: any
): Promise<string> {
  try {
    const address = await deployer.maciFactory()
    if (address !== ZERO_ADDRESS) {
      await run('verify-maci-factory', { address })
    }
    return SUCCESS
  } catch (error) {
    return (error as Error).message
  }
}

async function verifyClrFund(clrfund: Contract, run: any): Promise<string> {
  try {
    await run('verify', { address: clrfund.target })
    return SUCCESS
  } catch (error) {
    return (error as Error).message
  }
}

async function verifyFundingRoundFactory(
  clrfund: Contract,
  run: any
): Promise<string> {
  try {
    const address = await clrfund.roundFactory()
    if (address !== ZERO_ADDRESS) {
      await run('verify:verify', { address })
    }
    return SUCCESS
  } catch (error) {
    return (error as Error).message
  }
}

async function verifyRecipientRegistry(
  clrfund: Contract,
  run: any
): Promise<string> {
  try {
    const address = await clrfund.recipientRegistry()
    if (address !== ZERO_ADDRESS) {
      await run('verify-recipient-registry', { address })
    }
    return SUCCESS
  } catch (error) {
    return (error as Error).message
  }
}

async function verifyUserRegistry(
  clrfund: Contract,
  run: any
): Promise<string> {
  try {
    const address = await clrfund.userRegistry()
    if (address !== ZERO_ADDRESS) {
      await run('verify-user-registry', { address })
    }
    return SUCCESS
  } catch (error) {
    return (error as Error).message
  }
}

async function verifyRound(address: string, run: any): Promise<string> {
  try {
    await run('verify-round', { address })
    return SUCCESS
  } catch (error) {
    return (error as Error).message
  }
}

async function verifyMaci(maciAddress: string, run: any): Promise<string> {
  try {
    await run('verify-maci', { maciAddress })
    return SUCCESS
  } catch (error) {
    return (error as Error).message
  }
}

async function verifyTally(tally: Contract, run: any): Promise<string> {
  try {
    const constructorArguments = await Promise.all([
      tally.verifier(),
      tally.vkRegistry(),
      tally.poll(),
      tally.mp(),
    ])
    await run('verify:verify', { address: tally.target, constructorArguments })
    return SUCCESS
  } catch (error) {
    return (error as Error).message
  }
}

async function verifyPoll(pollContract: Contract, run: any): Promise<string> {
  try {
    const [, duration] = await pollContract.getDeployTimeAndDuration()
    const constructorArguments = await Promise.all([
      Promise.resolve(duration),
      pollContract.maxValues(),
      pollContract.treeDepths(),
      pollContract.batchSizes(),
      pollContract.coordinatorPubKey(),
      pollContract.extContracts(),
    ])

    await run('verify:verify', {
      address: pollContract.target,
      constructorArguments,
    })
    return SUCCESS
  } catch (error) {
    return (error as Error).message
  }
}

async function verifyContract(
  name: string,
  address: string,
  run: any,
  results: Result[]
) {
  let result = SUCCESS
  try {
    await run('verify:verify', { address })
  } catch (error) {
    result = (error as Error).message
  }
  results.push({ name, status: result })
}

async function getBrightIdSponsor(
  clrfund: Contract,
  ethers: any
): Promise<string | null> {
  const userRegistryAddress = await clrfund.userRegistry()
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
  .addParam('deployer', 'ClrFundDeployer contract address')
  .addOptionalParam('clrfund', 'ClrFund contract address')
  .setAction(async ({ deployer, clrfund }, { run, ethers }) => {
    const deployerContract = await ethers.getContractAt(
      'ClrFundDeployer',
      deployer
    )
    const maciFactoryAddress = await deployerContract.maciFactory()
    const maciFactory = await ethers.getContractAt(
      'MACIFactory',
      maciFactoryAddress
    )

    const results: Result[] = []
    let status = await verifyDeployer(deployerContract, run)
    results.push({ name: 'ClrFund Deployer', status })
    status = await verifyMaciFactory(deployerContract, run)
    results.push({ name: 'Maci factory', status })

    if (clrfund) {
      const clrfundContract = await ethers.getContractAt('ClrFund', clrfund)
      status = await verifyClrFund(clrfundContract, run)
      results.push({ name: 'ClrFund', status })
      status = await verifyRecipientRegistry(clrfundContract, run)
      results.push({ name: 'Recipient registry', status })
      status = await verifyUserRegistry(clrfundContract, run)
      results.push({ name: 'User registry', status })
      const sponsor = await getBrightIdSponsor(clrfundContract, ethers)
      if (sponsor) {
        await verifyContract('Sponsor', sponsor, run, results)
      }
      status = await verifyFundingRoundFactory(clrfundContract, run)
      results.push({ name: 'Funding Round Factory', status })

      const roundAddress = await clrfundContract.getCurrentRound()
      if (roundAddress !== ZERO_ADDRESS) {
        const round = await ethers.getContractAt('FundingRound', roundAddress)
        const maciAddress = await round.maci()
        status = await verifyRound(roundAddress, run)
        results.push({ name: 'Funding round', status })
        status = await verifyMaci(maciAddress, run)
        results.push({ name: 'MACI', status })

        const poll = await round.poll()
        if (poll !== ZERO_ADDRESS) {
          const pollContract = await ethers.getContractAt('Poll', poll)
          status = await verifyPoll(pollContract, run)
          results.push({ name: 'Poll', status })
        }

        const tally = await round.tally()
        if (tally !== ZERO_ADDRESS) {
          const tallyContract = await ethers.getContractAt('Tally', tally)
          status = await verifyTally(tallyContract, run)
          results.push({ name: 'Tally', status })
        }

        await verifyContract(
          'TopupToken',
          await round.topupToken(),
          run,
          results
        )
      }
    }

    await verifyContract(
      'clrfundTemplate',
      await deployerContract.clrfundTemplate(),
      run,
      results
    )
    await verifyContract(
      'VkRegistry',
      await maciFactory.vkRegistry(),
      run,
      results
    )

    const factories = await maciFactory.factories()
    await verifyContract('PollFactory', factories.pollFactory, run, results)
    await verifyContract('TallyFactory', factories.tallyFactory, run, results)
    await verifyContract(
      'MessageProcessorFactory',
      factories.messageProcessorFactory,
      run,
      results
    )

    results.forEach(({ name, status }, i) => {
      const color = status === SUCCESS ? '32' : '31'
      console.log(`${i} ${name}: \x1b[%sm%s\x1b[0m`, color, status)
    })
  })
