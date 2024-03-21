/**
 * Export all the round data after finalization to generate the leaderboard view
 *
 * Sample usage:
 *
 *  yarn hardhat export-round --round-address <address> \
 *  --output-dir ../vue-app/src/rounds \
 *  --operator <operator> --ipfs <ipfs-gateway-url> \
 *  --start-block <recipient-registry-start-block> --network <network>
 *
 * To generate the leaderboard view, deploy the clrfund website with the generated round data in the vue-app/src/rounds folder
 */

import { task, types } from 'hardhat/config'
import { Contract, formatUnits, getNumber } from 'ethers'
import { Ipfs } from '../../utils/ipfs'
import { Project, Round, RoundFileContent } from '../../utils/types'
import { RecipientRegistryLogProcessor } from '../../utils/RecipientRegistryLogProcessor'
import { getRecipientAddressAbi } from '../../utils/abi'
import { JSONFile } from '../../utils/JSONFile'
import path from 'path'
import fs from 'fs'

type RoundListEntry = {
  network: string
  address: string
  startTime: number
  votingDeadline: number
  isFinalized: boolean
}

const toUndefined = () => undefined
const toString = (val: bigint) => BigInt(val).toString()
const toZero = () => BigInt(0)

function roundFileName(directory: string, address: string): string {
  return path.join(directory, `${address}.json`)
}

function roundListFileName(directory: string): string {
  return path.join(directory, 'rounds.json')
}

function getEtherscanApiKey(config: any, network: string): string {
  let etherscanApiKey = ''
  if (config.etherscan?.apiKey) {
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
  JSONFile.write(filePath, rounds)
  console.log('Finished writing to', filePath)
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
    } catch (err) {
      console.log('err', err)
      // some older recipient registry contract does not have
      // the getRecipientAddress function, ignore error
    }

    const tallyResult = tally.results.tally[i]
    const spentVoiceCredits = tally.perVOSpentVoiceCredits.tally[i]
    const formattedDonationAmount = formatUnits(
      BigInt(spentVoiceCredits) * BigInt(voiceCreditFactor),
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
  ethers: any,
  operator: string
): Promise<Round> {
  console.log('Fetching round data for', roundContract.target)
  const address = await roundContract.getAddress()

  let nativeTokenAddress: string
  let nativeTokenDecimals = BigInt(0)
  let nativeTokenSymbol = ''
  try {
    nativeTokenAddress = await roundContract.nativeToken()
  } catch (err) {
    const errorMessage = `Failed to get nativeToken. Make sure the environment variable JSONRPC_HTTP_URL is set properly: ${
      (err as Error).message
    }`
    throw new Error(errorMessage)
  }

  try {
    const token = await ethers.getContractAt('ERC20', nativeTokenAddress)
    nativeTokenDecimals = await token.decimals().catch(toUndefined)
    nativeTokenSymbol = await token.symbol().catch(toUndefined)
    console.log(
      'Fetched token data',
      nativeTokenAddress,
      nativeTokenSymbol,
      nativeTokenDecimals
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : ''
    throw new Error(`Failed to fetch token data: ${errorMessage}`)
  }

  const contributorCount = await roundContract.contributorCount().catch(toZero)
  const matchingPoolSize = await roundContract.matchingPoolSize().catch(toZero)

  const totalSpent = await roundContract
    .totalSpent()
    .then(toString)
    .catch(toUndefined)

  const voiceCreditFactor = await roundContract.voiceCreditFactor()
  const isFinalized = await roundContract.isFinalized()
  const isCancelled = await roundContract.isCancelled()
  const tallyHash = await roundContract.tallyHash()
  const maciAddress = await roundContract.maci().catch(toUndefined)
  const pollAddress = await roundContract.poll().catch(toUndefined)
  let startTime = 0
  let endTime = 0
  let pollId: bigint | undefined
  let messages: bigint
  let maxMessages: bigint
  let maxRecipients: bigint
  let signUpDuration = BigInt(0)
  let votingDuration = BigInt(0)

  try {
    if (pollAddress) {
      const pollContract = await ethers.getContractAt('Poll', pollAddress)
      const [roundStartTime, roundDuration] =
        await pollContract.getDeployTimeAndDuration()
      startTime = getNumber(roundStartTime)
      signUpDuration = roundDuration
      votingDuration = roundDuration
      endTime = startTime + getNumber(roundDuration)

      pollId = await roundContract.pollId()

      messages = await pollContract.numMessages()
      const maxValues = await pollContract.maxValues()
      maxMessages = maxValues.maxMessages
      maxRecipients = maxValues.maxVoteOptions
    } else {
      const maci = await ethers.getContractAt('MACI', maciAddress)
      startTime = await maci.signUpTimestamp().catch(toZero)
      signUpDuration = await maci.signUpDurationSeconds().catch(toZero)
      votingDuration = await maci.votingDurationSeconds().catch(toZero)
      endTime =
        getNumber(startTime) +
        getNumber(signUpDuration) +
        getNumber(votingDuration)

      const treeDepths = await maci.treeDepths()
      messages = await maci.numMessages()
      maxMessages = BigInt(2) ** BigInt(treeDepths.messageTreeDepth) - BigInt(1)
      maxRecipients =
        BigInt(5) ** BigInt(treeDepths.voteOptionTreeDepth) - BigInt(1)
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : ''
    throw new Error(`Failed to get round duration ${errorMessage}`)
  }

  const userRegistryAddress = await roundContract
    .userRegistry()
    .catch(toUndefined)

  const recipientRegistryAddress = await roundContract.recipientRegistry()
  let recipientDepositAmount = '0'
  try {
    const recipientRegistry = await ethers.getContractAt(
      'OptimisticRecipientRegistry',
      recipientRegistryAddress
    )
    recipientDepositAmount = await recipientRegistry
      .baseDeposit()
      .then(toString)
  } catch {
    // ignore error - non optimistic recipient registry does not have deposit
  }

  const providerNetwork = await ethers.provider.getNetwork()
  const chainId = getNumber(providerNetwork.chainId)

  const round: Round = {
    chainId,
    operator,
    address,
    userRegistryAddress,
    recipientRegistryAddress,
    recipientDepositAmount,
    maciAddress,
    pollAddress,
    pollId,
    contributorCount,
    totalSpent: totalSpent || '',
    matchingPoolSize,
    voiceCreditFactor,
    isFinalized,
    isCancelled,
    tallyHash,
    nativeTokenAddress,
    nativeTokenSymbol,
    nativeTokenDecimals: getNumber(nativeTokenDecimals),
    startTime,
    endTime,
    signUpDuration: getNumber(signUpDuration),
    votingDuration: getNumber(votingDuration),
    messages,
    maxMessages,
    maxRecipients,
  }
  console.log('Round', round)
  return round
}

/**
 * Export all the round data for the leaderboard
 */
task('export-round', 'Export round data for the leaderboard')
  .addParam('roundAddress', 'Funding round contract address')
  .addParam('outputDir', 'Output directory')
  .addParam('operator', 'Funding round operator, e.g. ETHColombia')
  .addOptionalParam('ipfs', 'The IPFS gateway url')
  .addOptionalParam(
    'startBlock',
    'First block to process events from the recipient registry contract',
    0,
    types.int
  )
  .addOptionalParam(
    'endBlock',
    'Last block to process events from the recipient registry',
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
        operator,
        ipfs,
      },
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
      const round = await getRoundInfo(roundContract, ethers, operator)
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
          tally = await Ipfs.fetchJson(round.tallyHash, ipfs)
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

      // set totalSpent to 0 if not set
      if (!round.totalSpent) {
        round.totalSpent = '0'
      }

      // write to round file
      const filename = roundFileName(outputSubDir, round.address)
      const roundData: RoundFileContent = {
        round,
        projects,
        tally,
      }
      JSONFile.write(filename, roundData)
      console.log('Finished writing to', filename)

      // update round list
      const listFilename = roundListFileName(outputDir)
      await updateRoundList(listFilename, {
        network: network.name,
        address: round.address,
        startTime: round.startTime,
        votingDeadline: round.endTime,
        isFinalized: round.isFinalized && !round.isCancelled,
      })
    }
  )
