import { task, types } from 'hardhat/config'
import { utils, Contract, BigNumber } from 'ethers'
import fs from 'fs'
import { Ipfs } from '../utils/ipfs'
import { Project, Round } from '../utils/types'
import { RecipientRegistryLogProcessor } from '../utils/RecipientRegistryLogProcessor'
import path from 'path'

const getRecipientAddressAbi = [
  `function getRecipientAddress(uint256 _index, uint256 _startTime, uint256 _endTime)` +
    ` external view returns (address)`,
  `function tcr() external view returns (address)`,
]

type RoundData = {
  round: Round
  projects: Project[]
  tally: any
}

type RoundListEntry = {
  address: string
  network: string
  startTime: number
}

function roundFileName(directory: string, address: string): string {
  return path.join(directory, `${address}.json`)
}

function roundListFileName(directory: string): string {
  return path.join(directory, 'rounds.json')
}

function writeToFile(filePath: string, roundData: RoundData) {
  const outputString = JSON.stringify(roundData, null, 2)
  fs.writeFileSync(filePath, outputString)
  console.log('Successfully written to ', filePath)
}

async function updateRoundList(filePath: string, round: RoundListEntry) {
  let rounds: RoundListEntry[]
  try {
    const json = await fetch(filePath).then((response) => response.json())
    rounds = Array.isArray(json) ? [...json, round] : [round]
  } catch {
    rounds = [round]
  }

  rounds.sort((round1, round2) => round1.startTime - round2.startTime)
  const outputString = JSON.stringify(rounds, null, 2)
  fs.appendFileSync(filePath, outputString)

  console.log('Successfully written to ', filePath)
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
    const address = await recipientRegistry.getRecipientAddress(
      i,
      startTime,
      endTime
    )

    const tallyVotes = tally.results.tally[i]
    const tallyVoiceCredits = tally.totalVoiceCreditsPerVoteOption.tally[i]
    const donationAmount = utils.formatUnits(
      BigNumber.from(tallyVoiceCredits).mul(voiceCreditFactor),
      decimals
    )

    const fundingAmount = await roundContract.getAllocatedAmount(
      tallyVotes,
      tallyVoiceCredits
    )

    const project = projectIndices[i] || projectAddresses[address.toLowerCase()]
    projects.push({
      ...project,
      tallyRecipientAddress: address,
      tallyIndex: i,
      tallyVotes,
      tallyVoiceCredits,
      donationAmount,
      fundingAmount: utils.formatUnits(fundingAmount, decimals),
    })
  }

  return projects
}

async function getRoundInfo(
  roundContract: Contract,
  ethers: any
): Promise<Round> {
  console.log('Fetching round data...')
  const nativeTokenAddress = await roundContract.nativeToken()
  const token = await ethers.getContractAt('ERC20', nativeTokenAddress)
  const decimals = await token.decimals()
  const symbol = await token.symbol()
  const nativeToken = { symbol, decimals }

  const contributorCount = await roundContract.contributorCount()
  const matchingPoolSize = await roundContract.matchingPoolSize()
  const totalSpent = await roundContract.totalSpent()
  const voiceCreditFactor = await roundContract.voiceCreditFactor()
  const isFinalized = await roundContract.isFinalized()
  const isCancelled = await roundContract.isCancelled()
  const tallyHash = await roundContract.tallyHash()

  const maciAddress = await roundContract.maci()
  const maci = await ethers.getContractAt('MACI', maciAddress)
  const startTime = await maci.signUpTimestamp()
  const signUpDuration = await maci.signUpDurationSeconds()
  const votingDuration = await maci.votingDurationSeconds()
  const endTime = startTime.add(signUpDuration).add(votingDuration)
  const recipientRegistryAddress = await roundContract.recipientRegistry()

  const round = {
    address: roundContract.address,
    maciAddress,
    contributorCount: contributorCount.toString(),
    totalSpent: totalSpent.toString(),
    matchingPoolSize: matchingPoolSize.toString(),
    voiceCreditFactor: voiceCreditFactor.toString(),
    isFinalized,
    isCancelled,
    tallyHash,
    nativeToken,
    startTime: BigNumber.from(startTime).toNumber(),
    endTime: BigNumber.from(endTime).toNumber(),
    recipientRegistryAddress,
  }

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

      const directoryStats = fs.statSync(outputDir)
      if (!directoryStats.isDirectory()) {
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
