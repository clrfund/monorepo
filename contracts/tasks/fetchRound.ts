import { task, types } from 'hardhat/config'
import { HardhatConfig } from 'hardhat/types'
import { utils, Contract, BigNumber } from 'ethers'
import fs from 'fs'
import { Ipfs } from '../utils/ipfs'
import { Project, Round } from '../utils/types'
import { RecipientRegistryLogProcessor } from '../utils/RecipientRegistryLogProcessor'
import { getRecipientAddressAbi } from '../utils/abi'
import path from 'path'

type RoundData = {
  round: Round
  projects: Project[]
  tally: any
}

type RoundListEntry = {
  network: string
  address: string
  startTime: number
  isFinalized: boolean
}

const toUndefined = () => undefined
const toString = (val: BigNumber) => BigNumber.from(val).toString()
const toZero = () => BigNumber.from(0)

function roundFileName(directory: string, address: string): string {
  return path.join(directory, `${address}.json`)
}

function roundListFileName(directory: string): string {
  return path.join(directory, 'rounds.json')
}

function writeToFile(filePath: string, data: any) {
  const outputString = JSON.stringify(data, null, 2)
  fs.writeFileSync(filePath, outputString + '\n')
  console.log('Successfully written to ', filePath)
}

function getEtherscanApiKey(config: HardhatConfig, network: string): string {
  let etherscanApiKey = ''
  if (config.etherscan.apiKey) {
    if (typeof config.etherscan.apiKey === 'string') {
      etherscanApiKey = config.etherscan.apiKey
    } else {
      etherscanApiKey = config.etherscan.apiKey[network]
    }
  }

  return etherscanApiKey
}

function roundMapKey(round: RoundListEntry): string {
  return `${round.network}.${round.address}`
}

async function updateRoundList(filePath: string, round: RoundListEntry) {
  const roundMap = new Map<string, RoundListEntry>()
  let json = ''
  try {
    json = fs.readFileSync(filePath, 'utf8')
  } catch {
    json = '[]'
  }
  const previousRounds = JSON.parse(json)
  for (let i = 0; i < previousRounds.length; i++) {
    const previous = previousRounds[i]
    roundMap.set(roundMapKey(previous), previous)
  }
  roundMap.set(roundMapKey(round), round)

  const rounds: RoundListEntry[] = Array.from(roundMap.values())

  // sort in ascending start time order
  rounds.sort((round1, round2) => round1.startTime - round2.startTime)
  writeToFile(filePath, rounds)
}

async function mergeRecipientTally({
  round,
  roundContract,
  recipientRegistry,
  projectRecords,
  tally,
}: {
  round: Round
  roundContract: Contract
  recipientRegistry: Contract
  projectRecords: Record<string, Project>
  tally: any
}): Promise<Project[]> {
  console.log('Merging projects and tally results...')
  const { startTime, endTime, voiceCreditFactor, nativeTokenDecimals } = round

  round.totalSpent = round.totalSpent || tally.totalVoiceCredits.spent

  const projectAddresses = Object.values(projectRecords).reduce(
    (addresses: Record<string, Project>, project) => {
      if (project.recipientAddress) {
        const lowerCaseAddress = project.recipientAddress.toLowerCase()
        addresses[lowerCaseAddress] = project
      }
      return addresses
    },
    {}
  )

  const projectIndices = Object.values(projectRecords).reduce(
    (indices: Record<number, Project>, project) => {
      if (project.recipientIndex) {
        indices[project.recipientIndex] = project
      }
      return indices
    },
    {}
  )

  const projects: Project[] = []
  for (let i = 0; i < tally.results.tally.length; i++) {
    let address = ''

    try {
      address = await recipientRegistry.getRecipientAddress(
        i,
        startTime,
        endTime
      )
    } catch {
      // some older recipient registry contract does not have
      // the getRecipientAddress function, ignore error
    }

    const tallyResult = tally.results.tally[i]
    const spentVoiceCredits = tally.totalVoiceCreditsPerVoteOption.tally[i]
    const formattedDonationAmount = utils.formatUnits(
      BigNumber.from(spentVoiceCredits).mul(voiceCreditFactor),
      nativeTokenDecimals
    )

    const allocatedAmount = await roundContract
      .getAllocatedAmount(tallyResult, spentVoiceCredits)
      .then(toString)

    const project = projectIndices[i] || projectAddresses[address.toLowerCase()]
    if (project) {
      projects.push({
        ...project,
        tallyResult,
        spentVoiceCredits,
        formattedDonationAmount,
        allocatedAmount,
      })
    }
  }

  return projects
}

async function getRoundInfo(
  roundContract: Contract,
  ethers: any
): Promise<Round> {
  console.log('Fetching round data...')
  const round: any = { address: roundContract.address }
  round.nativeTokenAddress = await roundContract.nativeToken()

  try {
    const token = await ethers.getContractAt('ERC20', round.nativeTokenAddress)
    round.nativeTokenDecimals = await token.decimals().catch(toUndefined)
    round.nativeTokenSymbol = await token.symbol().catch(toUndefined)
    console.log(
      'Fetched token data',
      round.nativeTokenAddress,
      round.nativeTokenSymbol,
      round.nativeTokenDecimals
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : ''
    throw new Error(`Failed to fetch token data: ${errorMessage}`)
  }

  round.contributorCount = await roundContract
    .contributorCount()
    .then((val: BigNumber) => val.toNumber())
    .catch(toZero)

  round.matchingPoolSize = await roundContract
    .matchingPoolSize()
    .then(toString)
    .catch(toZero)

  round.totalSpent = await roundContract
    .totalSpent()
    .then(toString)
    .catch(toZero)

  round.voiceCreditFactor = await roundContract.voiceCreditFactor()
  round.isFinalized = await roundContract.isFinalized()
  round.isCancelled = await roundContract.isCancelled()
  round.tallyHash = await roundContract.tallyHash()

  try {
    round.maciAddress = await roundContract.maci().catch(toUndefined)
    const maci = await ethers.getContractAt('MACI', round.maciAddress)
    const startTime = await maci.signUpTimestamp().catch(toZero)
    round.startTime = startTime.toNumber()
    const signUpDuration = await maci.signUpDurationSeconds().catch(toZero)
    const votingDuration = await maci.votingDurationSeconds().catch(toZero)
    const endTime = startTime.add(signUpDuration).add(votingDuration)
    round.endTime = endTime.toNumber()
    round.signUpDuration = signUpDuration.toNumber()
    round.votingDuration = votingDuration.toNumber()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : ''
    throw new Error(`Failed to get MACI data ${errorMessage}`)
  }

  round.userRegistryAddress = await roundContract
    .userRegistry()
    .catch(toUndefined)

  round.recipientRegistryAddress = await roundContract.recipientRegistry()

  console.log('Round', round)
  return round
}

/**
 * Fetch all the round data for static site
 */
task('fetch-round', 'Fetch round data')
  .addParam('roundAddress', 'Funding round contract address')
  .addParam('outputDir', 'Output directory')
  .addOptionalParam(
    'startBlock',
    'First block to process from the recipient registry contract',
    0,
    types.int
  )
  .addOptionalParam(
    'endBlock',
    'Last block to process from the recipient registry',
    undefined,
    types.int
  )
  .addOptionalParam(
    'blocksPerBatch',
    'Number of blocks of logs to process per batch',
    50000,
    types.int
  )
  .setAction(
    async (
      { roundAddress, outputDir, startBlock, endBlock, blocksPerBatch },
      { ethers, network, config }
    ) => {
      console.log('Processing on ', network.name)
      console.log('Funding round address', roundAddress)

      const etherscanApiKey = getEtherscanApiKey(config, network.name)
      if (!etherscanApiKey) {
        throw new Error('Etherscan API key not set')
      }

      const outputSubDir = path.join(outputDir, network.name)
      try {
        fs.statSync(outputSubDir)
      } catch {
        // exit script if failed to create directory
        fs.mkdirSync(outputSubDir, { recursive: true })
      }

      const roundContract = await ethers.getContractAt(
        'FundingRound',
        roundAddress
      )
      const round = await getRoundInfo(roundContract, ethers)
      const recipientRegistry = new Contract(
        round.recipientRegistryAddress,
        getRecipientAddressAbi,
        ethers.provider
      )

      const logProcessor = new RecipientRegistryLogProcessor(recipientRegistry)
      const logs = await logProcessor.fetchLogs({
        recipientRegistry,
        startBlock,
        endBlock,
        blocksPerBatch,
        network: network.name,
        etherscanApiKey,
      })

      console.log('Parsing logs...')
      const projectRecords = await logProcessor.parseLogs(logs)

      let tally: any = undefined
      if (round.isFinalized && !round.isCancelled) {
        if (!round.tallyHash) {
          throw new Error('Missing tallyHash')
        }

        try {
          tally = await Ipfs.fetchJson(round.tallyHash)
        } catch (err) {
          console.log('Failed to get tally file', round.tallyHash, err)
          throw err
        }
      }

      let projects = Object.values(projectRecords)
      if (round.isFinalized && !round.isCancelled && projects.length > 0) {
        projects = await mergeRecipientTally({
          round,
          roundContract,
          recipientRegistry,
          projectRecords,
          tally,
        })
      }

      // write to round file
      const filename = roundFileName(outputSubDir, round.address)
      const roundData: RoundData = {
        round,
        projects,
        tally,
      }
      writeToFile(filename, roundData)

      // update round list
      const listFilename = roundListFileName(outputDir)
      await updateRoundList(listFilename, {
        network: network.name,
        address: round.address,
        startTime: round.startTime,
        isFinalized: round.isFinalized && !round.isCancelled,
      })
    }
  )
