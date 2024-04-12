/* eslint-disable no-console */
import { task } from 'hardhat/config'

import { EContracts } from '../helpers/types'

import { ContractStorage } from '../helpers/ContractStorage'
import { ContractVerifier } from '../helpers/ContractVerifier'
import {
  BrightIdUserRegistry,
  ClrFund,
  MerkleUserRegistry,
  SemaphoreUserRegistry,
  SnapshotUserRegistry,
} from '../../typechain-types'
import { BaseContract } from 'ethers'
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types'
import { ZERO_ADDRESS } from '../../utils/constants'
import { ConstructorArguments } from '../helpers/ConstructorArguments'

type ContractInfo = {
  name: string
  address: string
}

type VerificationSummary = {
  contract: string
  ok: boolean
  err?: string
}

/**
 * Get the recipient registry contract name
 * @param registryAddress The recipient registry contract address
 * @param ethers The Hardhat Ethers helper
 * @returns The recipient registry contract name
 */
async function getRecipientRegistryName(
  registryAddress: string,
  ethers: HardhatEthersHelpers
): Promise<string> {
  try {
    const contract = await ethers.getContractAt(
      EContracts.KlerosGTCRAdapter,
      registryAddress
    )
    const tcr = await contract.tcr()
    if (tcr === ZERO_ADDRESS) {
      throw new Error(
        'Unexpected zero tcr from a Kleros recipient registry: ' +
          registryAddress
      )
    }
    return EContracts.KlerosGTCRAdapter
  } catch {
    // not a kleros registry
  }

  // try optimistic
  const contract = await ethers.getContractAt(
    EContracts.OptimisticRecipientRegistry,
    registryAddress
  )

  try {
    await contract.challengePeriodDuration()
    return EContracts.OptimisticRecipientRegistry
  } catch {
    // not optimistic, use simple registry
    return EContracts.SimpleRecipientRegistry
  }
}

/**
 * Get the user registry contract name
 * @param registryAddress The user registry contract address
 * @param ethers The Hardhat Ethers helper
 * @returns The user registry contract name
 */
async function getUserRegistryName(
  registryAddress: string,
  ethers: HardhatEthersHelpers
): Promise<string> {
  try {
    const contract = (await ethers.getContractAt(
      EContracts.BrightIdUserRegistry,
      registryAddress
    )) as BaseContract as BrightIdUserRegistry
    await contract.context()
    return EContracts.BrightIdUserRegistry
  } catch {
    // not a BrightId user registry
  }

  // try semaphore user registry
  try {
    const contract = (await ethers.getContractAt(
      EContracts.SemaphoreUserRegistry,
      registryAddress
    )) as BaseContract as SemaphoreUserRegistry
    await contract.isVerifiedSemaphoreId(1)
    return EContracts.SemaphoreUserRegistry
  } catch {
    // not a semaphore user registry
  }

  // try snapshot user regitry
  try {
    const contract = (await ethers.getContractAt(
      EContracts.SnapshotUserRegistry,
      registryAddress
    )) as BaseContract as SnapshotUserRegistry
    await contract.storageRoot()
  } catch {
    // not snapshot user registry
  }

  // try merkle user regitry
  try {
    const contract = (await ethers.getContractAt(
      EContracts.MerkleUserRegistry,
      registryAddress
    )) as BaseContract as MerkleUserRegistry
    await contract.merkleRoot()
  } catch {
    // not merkle user registry
  }

  return EContracts.SimpleUserRegistry
}

/**
 * Get the list of contracts to verify
 * @param clrfund The ClrFund contract address
 * @param ethers The Hardhat Ethers helper
 * @param etherscanProvider The Etherscan provider
 * @returns The list of contracts to verify
 */
async function getContractList(
  clrfund: string,
  ethers: HardhatEthersHelpers
): Promise<ContractInfo[]> {
  const contractList: ContractInfo[] = [
    {
      name: EContracts.ClrFund,
      address: clrfund,
    },
  ]

  const clrfundContract = (await ethers.getContractAt(
    EContracts.ClrFund,
    clrfund
  )) as BaseContract as ClrFund

  const fundingRoundFactoryAddress = await clrfundContract.roundFactory()
  if (fundingRoundFactoryAddress !== ZERO_ADDRESS) {
    contractList.push({
      name: EContracts.FundingRoundFactory,
      address: fundingRoundFactoryAddress,
    })
  }

  const maciFactoryAddress = await clrfundContract.maciFactory()
  if (maciFactoryAddress !== ZERO_ADDRESS) {
    contractList.push({
      name: EContracts.MACIFactory,
      address: maciFactoryAddress,
    })

    const maciFactory = await ethers.getContractAt(
      EContracts.MACIFactory,
      maciFactoryAddress
    )
    const vkRegistryAddress = await maciFactory.vkRegistry()
    contractList.push({
      name: EContracts.VkRegistry,
      address: vkRegistryAddress,
    })

    const factories = await maciFactory.factories()
    contractList.push({
      name: EContracts.PollFactory,
      address: factories.pollFactory,
    })

    contractList.push({
      name: EContracts.TallyFactory,
      address: factories.tallyFactory,
    })

    contractList.push({
      name: EContracts.MessageProcessorFactory,
      address: factories.messageProcessorFactory,
    })
  }

  const fundingRoundAddress = await clrfundContract.getCurrentRound()
  if (fundingRoundAddress !== ZERO_ADDRESS) {
    contractList.push({
      name: EContracts.FundingRound,
      address: fundingRoundAddress,
    })

    const fundingRound = await ethers.getContractAt(
      EContracts.FundingRound,
      fundingRoundAddress
    )

    const maciAddress = await fundingRound.maci()
    if (maciAddress !== ZERO_ADDRESS) {
      contractList.push({
        name: EContracts.MACI,
        address: maciAddress,
      })
    }

    // Poll
    const pollAddress = await fundingRound.poll()
    if (pollAddress !== ZERO_ADDRESS) {
      contractList.push({
        name: EContracts.Poll,
        address: pollAddress,
      })
    }

    // Tally
    const tallyAddress = await fundingRound.tally()
    if (tallyAddress !== ZERO_ADDRESS) {
      contractList.push({
        name: EContracts.Tally,
        address: tallyAddress,
      })

      // Verifier
      const tallyContract = await ethers.getContractAt(
        EContracts.Tally,
        tallyAddress
      )
      const verifierAddress = await tallyContract.verifier()
      if (verifierAddress !== ZERO_ADDRESS) {
        contractList.push({
          name: EContracts.Verifier,
          address: verifierAddress,
        })
      }

      // MessageProcessor
      const messageProcessorAddress = await tallyContract.messageProcessor()
      if (messageProcessorAddress !== ZERO_ADDRESS) {
        contractList.push({
          name: EContracts.MessageProcessor,
          address: messageProcessorAddress,
        })
      }
    }

    // User Registry
    const userRegistryAddress = await fundingRound.userRegistry()
    if (userRegistryAddress !== ZERO_ADDRESS) {
      const name = await getUserRegistryName(userRegistryAddress, ethers)
      contractList.push({
        name,
        address: userRegistryAddress,
      })
    }

    // Recipient Registry
    const recipientRegistryAddress = await fundingRound.recipientRegistry()
    if (recipientRegistryAddress !== ZERO_ADDRESS) {
      const name = await getRecipientRegistryName(
        recipientRegistryAddress,
        ethers
      )
      contractList.push({
        name,
        address: recipientRegistryAddress,
      })
    }
  }

  return contractList
}

/**
 * Main verification task which runs hardhat-etherscan task for all the deployed contract.
 */
task('verify-all', 'Verify contracts listed in storage')
  .addOptionalParam('clrfund', 'The ClrFund contract address')
  .addFlag('force', 'Ignore verified status')
  .setAction(async ({ clrfund }, hre) => {
    const { ethers, config, network } = hre

    const storage = ContractStorage.getInstance()
    const clrfundContractAddress =
      clrfund ?? storage.mustGetAddress(EContracts.ClrFund, network.name)

    const contractList = await getContractList(clrfundContractAddress, ethers)
    const constructorArguments = new ConstructorArguments(hre)
    const verifier = new ContractVerifier(hre)
    const summary: VerificationSummary[] = []

    for (let i = 0; i < contractList.length; i += 1) {
      const { name, address } = contractList[i]

      try {
        const args = await constructorArguments.get(name, address, ethers)
        let contract: string | undefined
        let libraries: string | undefined
        const [ok, err] = await verifier.verify(
          address,
          args,
          libraries,
          contract
        )

        summary.push({ contract: `${address} ${name}`, ok, err })
      } catch (e) {
        // error getting the constructors, skipping
        summary.push({
          contract: `${address} ${name}`,
          ok: false,
          err: 'Failed to get constructor. ' + (e as Error).message,
        })
      }
    }

    summary.forEach(({ contract, ok, err }, i) => {
      const color = ok ? '32' : '31'
      console.log(
        `${i + 1} ${contract}: \x1b[%sm%s\x1b[0m`,
        color,
        ok ? 'ok' : err
      )
    })
  })
