import { task, types } from 'hardhat/config'
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
}

const toUndefined = () => undefined
const toString = (val: BigNumber) => BigNumber.from(val).toString()

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

function roundMapKey(round: RoundListEntry): string {
  return `${round.network}.${round.address}`
}

async function updateRoundList(filePath: string, round: RoundListEntry) {
  const roundMap = new Map<string, RoundListEntry>()
  roundMap.set(roundMapKey(round), round)
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

  const rounds: RoundListEntry[] = Array.from(roundMap.values())

  // sort in descending start time order
  rounds.sort((round1, round2) => round2.startTime - round1.startTime)
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
  const { startTime, endTime, voiceCreditFactor } = round
  const { decimals } = round.nativeToken

  const projectAddresses = Object.values(projectRecords).reduce(
    (addresses: Record<string, Project>, record) => {
      if (record.address) {
        const lowerCaseAddress = record.address.toLowerCase()
        addresses[lowerCaseAddress] = record
      }
      return addresses
    },
    {}
  )

  const projectIndices = Object.values(projectRecords).reduce(
    (indices: Record<number, Project>, record) => {
      if (record.recipientIndex) {
        indices[record.recipientIndex] = record
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
      decimals
    )

    const allocatedAmount = await roundContract.getAllocatedAmount(
      tallyResult,
      spentVoiceCredits
    )
    const formattedAllocatedAmount = utils.formatUnits(
      allocatedAmount,
      decimals
    )

    const project = projectIndices[i] || projectAddresses[address.toLowerCase()]
    projects.push({
      ...project,
      tallyRecipientAddress: address,
      tallyIndex: i,
      tallyResult,
      spentVoiceCredits,
      formattedDonationAmount,
      formattedAllocatedAmount,
    })
  }

  return projects
}

async function getRoundInfo(
  roundContract: Contract,
  ethers: any
): Promise<Round> {
  console.log('Fetching round data...')
  const round: any = { address: roundContract.address }
  round.nativeTokenAddress = await roundContract
    .nativeToken()
    .catch(toUndefined)
  if (round.nativeTokenAddress) {
    const token = await ethers.getContractAt('ERC20', round.nativeTokenAddress)
    const decimals = await token.decimals()

    const symbol = await token.symbol()
    round.nativeToken = { symbol, decimals }
  }

  round.contributorCount = await roundContract
    .contributorCount()
    .then((val: BigNumber) => BigNumber.from(val).toNumber())
    .catch(toUndefined)

  round.matchingPoolSize = await roundContract
    .matchingPoolSize()
    .then(toString)
    .catch(toUndefined)
  round.totalSpent = await roundContract
    .totalSpent()
    .then(toString)
    .catch(toUndefined)
  round.voiceCreditFactor = await roundContract
    .voiceCreditFactor()
    .then(toString)
    .catch(toUndefined)
  round.isFinalized = await roundContract.isFinalized().catch(toUndefined)
  round.isCancelled = await roundContract.isCancelled().catch(toUndefined)
  round.tallyHash = await roundContract.tallyHash().catch(toUndefined)

  round.maciAddress = await roundContract.maci().catch(toUndefined)

  if (round.maciAddress) {
    try {
      const maci = await ethers.getContractAt('MACI', round.maciAddress)
      const startTime = await maci.signUpTimestamp()
      round.startTime = startTime.toNumber()
      const signUpDuration = await maci.signUpDurationSeconds()
      const votingDuration = await maci.votingDurationSeconds()
      const endTime = startTime.add(signUpDuration).add(votingDuration)
      round.endTime = endTime.toNumber()
    } catch {
      // ignore error
    }
  }

  round.recipientRegistryAddress = await roundContract
    .recipientRegistry()
    .catch(toUndefined)

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
    'etherscanApiKey',
    'Etherscan API key used to retrieve logs using etherscan API',
    undefined,
    types.string
  )
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
      {
        roundAddress,
        outputDir,
        startBlock,
        endBlock,
        blocksPerBatch,
        etherscanApiKey,
      },
      { ethers, network }
    ) => {
      console.log('Processing on ', network.name)
      console.log('Funding round address', roundAddress)

      try {
        fs.statSync(outputDir)
      } catch {
        // exit script if failed to create directory
        fs.mkdirSync(outputDir, { recursive: true })
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
        try {
          tally = await Ipfs.fetchJson(round.tallyHash)
        } catch (err) {
          console.log('Failed to get tally file', round.tallyHash, err)
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
      const filename = roundFileName(outputDir, round.address)
      writeToFile(filename, {
        round,
        projects,
        tally,
      })

      // update round list
      const listFilename = roundListFileName(outputDir)
      await updateRoundList(listFilename, {
        network: network.name,
        address: round.address,
        startTime: round.startTime,
      })
    }
  )
