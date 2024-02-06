/**
 * Verifies all the ClrFund contracts
 *
 * Sample usage:
 * yarn hardhat verify-all --clrfund <clrfund-address> --network <network>
 */

import { Contract } from 'ethers'
import { task } from 'hardhat/config'
import { ZERO_ADDRESS } from '../../utils/constants'
import { EContracts } from '../../utils/types'

const SUCCESS = 'success'

type Result = {
  name: string
  status: string
}

async function verifyMaciFactory(clrfund: Contract, run: any): Promise<string> {
  try {
    const address = await clrfund.maciFactory()
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
    await run('verify:verify', { address: clrfund.target })
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
      tally.messageProcessor(),
    ])
    await run('verify:verify', { address: tally.target, constructorArguments })
    return SUCCESS
  } catch (error) {
    return (error as Error).message
  }
}

async function verifyMessageProcessor(
  messageProcesor: Contract,
  run: any
): Promise<string> {
  try {
    const constructorArguments = await Promise.all([
      messageProcesor.verifier(),
      messageProcesor.vkRegistry(),
      messageProcesor.poll(),
    ])
    await run('verify:verify', {
      address: messageProcesor.target,
      constructorArguments,
    })
    return SUCCESS
  } catch (error) {
    return (error as Error).message
  }
}

async function verifyPoll(address: string, run: any): Promise<string> {
  try {
    await run('verify-poll', { address })
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
    EContracts.BrightIdUserRegistry,
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
  .addParam('clrfund', 'ClrFund contract address')
  .setAction(async ({ clrfund }, { run, ethers }) => {
    const clrfundContract = await ethers.getContractAt(
      EContracts.ClrFund,
      clrfund
    )
    const maciFactoryAddress = await clrfundContract.maciFactory()
    const maciFactory = await ethers.getContractAt(
      EContracts.MACIFactory,
      maciFactoryAddress
    )

    const results: Result[] = []
    let status = await verifyMaciFactory(clrfundContract, run)
    results.push({ name: EContracts.MACIFactory, status })

    await verifyContract(
      'VkRegistry',
      await maciFactory.vkRegistry(),
      run,
      results
    )

    const factories = await maciFactory.factories()
    await verifyContract(
      EContracts.PollFactory,
      factories.pollFactory,
      run,
      results
    )
    await verifyContract(
      EContracts.TallyFactory,
      factories.tallyFactory,
      run,
      results
    )
    await verifyContract(
      EContracts.MessageProcessorFactory,
      factories.messageProcessorFactory,
      run,
      results
    )

    status = await verifyClrFund(clrfundContract, run)
    results.push({ name: EContracts.ClrFund, status })
    status = await verifyRecipientRegistry(clrfundContract, run)
    results.push({ name: 'RecipientRegistry', status })
    status = await verifyUserRegistry(clrfundContract, run)
    results.push({ name: 'UserRegistry', status })
    const sponsor = await getBrightIdSponsor(clrfundContract, ethers)
    if (sponsor) {
      await verifyContract(EContracts.BrightIdSponsor, sponsor, run, results)
    }
    status = await verifyFundingRoundFactory(clrfundContract, run)
    results.push({ name: EContracts.FundingRoundFactory, status })

    const roundAddress = await clrfundContract.getCurrentRound()
    if (roundAddress !== ZERO_ADDRESS) {
      const round = await ethers.getContractAt(
        EContracts.FundingRound,
        roundAddress
      )
      const maciAddress = await round.maci()
      status = await verifyRound(roundAddress, run)
      results.push({ name: EContracts.FundingRound, status })
      status = await verifyMaci(maciAddress, run)
      results.push({ name: EContracts.MACI, status })

      const poll = await round.poll()
      if (poll !== ZERO_ADDRESS) {
        status = await verifyPoll(poll, run)
        results.push({ name: EContracts.Poll, status })
      }

      const tally = await round.tally()
      if (tally !== ZERO_ADDRESS) {
        const tallyContract = await ethers.getContractAt(
          EContracts.Tally,
          tally
        )
        status = await verifyTally(tallyContract, run)
        results.push({ name: EContracts.Tally, status })

        const messageProcessorAddress = await tallyContract.messageProcessor()
        if (messageProcessorAddress !== ZERO_ADDRESS) {
          const mpContract = await ethers.getContractAt(
            EContracts.MessageProcessor,
            messageProcessorAddress
          )
          status = await verifyMessageProcessor(mpContract, run)
          results.push({ name: EContracts.MessageProcessor, status })
        }
      }

      await verifyContract(
        EContracts.TopupToken,
        await round.topupToken(),
        run,
        results
      )
    }

    results.forEach(({ name, status }, i) => {
      const color = status === SUCCESS ? '32' : '31'
      console.log(`${i} ${name}: \x1b[%sm%s\x1b[0m`, color, status)
    })
  })
