import { task, types } from 'hardhat/config'
import { utils, providers, Contract, BigNumber } from 'ethers'
import { EventFilter, Log } from '@ethersproject/abstract-provider'
import fs from 'fs'

interface Project {
  id: string
  recipientIndex?: number
  address: string
  name: string
  state: string
  removedAt?: Date
  tallyIndex?: number
  tallyVotes?: string
  tallyVoiceCredits?: string
  donationAmount?: string
  fundingAmount?: string
  metadata?: any
}

function isRemoval(state: number): boolean {
  return state === 1
}

async function fetchTally(tallyHash: string): Promise<any> {
  const url = `https://ipfs.io/ipfs/${tallyHash}`
  const result = utils.fetchJson(url)
  return result
}

function logsFirstBlock(logs: Log[]): number | null {
  return logs.length > 0 ? logs[0].blockNumber : null
}

function logsLastBlock(logs: Log[]): number | null {
  return logs.length > 0 ? logs[logs.length - 1].blockNumber : null
}

async function fetchLogs({
  provider,
  filter,
  startBlock,
  lastBlock,
  blocksPerBatch,
}: {
  provider: providers.Provider
  filter: EventFilter
  startBlock: number
  lastBlock: number
  blocksPerBatch: number
}): Promise<Log[]> {
  let eventLogs: Log[] = []

  for (let i = startBlock; i <= lastBlock; i += blocksPerBatch + 1) {
    const toBlock =
      i + blocksPerBatch >= lastBlock ? lastBlock : i + blocksPerBatch

    const logs = await provider.getLogs({
      ...filter,
      fromBlock: i,
      toBlock,
    })
    eventLogs = eventLogs.concat(logs)
  }

  return eventLogs
}

async function genProjectRecords({
  submitLogs,
  resolveLogs,
  recipientRegistry,
}: {
  submitLogs: Log[]
  resolveLogs: Log[]
  recipientRegistry: Contract
}): Promise<Record<string, Project>> {
  const requests: Record<string, Project> = {}
  submitLogs.forEach((log) => {
    const { args } = recipientRegistry.interface.parseLog(log)

    const recipientId = args._recipientId
    const recipientIndex = args._recipientIndex
    const state = isRemoval(args._type) ? 'Removed' : 'Accepted'

    if (!requests[recipientId]) {
      let name = ''
      let metadata
      try {
        metadata = JSON.parse(args._metadata)
        name = metadata.name
        // eslint-disable-next-line no-empty
      } catch {}

      requests[recipientId] = {
        id: recipientId,
        recipientIndex,
        address: args._recipient,
        name,
        state,
        metadata,
      }
    }
  })

  resolveLogs.forEach((log) => {
    const { args } = recipientRegistry.interface.parseLog(log)
    const recipientId = args._recipientId
    const recipientIndex = args._recipientIndex.toString()

    if (!requests[recipientId]) {
      throw new Error(
        'Missing SubmitRequest logs, make sure startBlock and endBlock is set correctly'
      )
    }

    if (args._rejected) {
      requests[recipientId].removedAt = args._timestamp.toString()
      requests[recipientId].state = 'Rejected'
    } else if (isRemoval(args._type)) {
      requests[recipientId].removedAt = args._timestamp.toString()
      requests[recipientId].state = 'Removed'
    } else {
      requests[recipientId].recipientIndex = recipientIndex
    }
  })

  return Object.values(requests).reduce(
    (records: Record<string, Project>, req) => {
      records[req.address] = req
      return records
    },
    {}
  )
}

async function processFinalizedRound({
  round,
  recipientRegistry,
  projectRecords,
  decimals,
  startTime,
  endTime,
  voiceCreditFactor,
  tally,
}: {
  round: Contract
  recipientRegistry: Contract
  projectRecords: Record<string, Project>
  decimals: BigNumber
  startTime: BigNumber
  endTime: BigNumber
  voiceCreditFactor: BigNumber
  tally: any
}): Promise<Project[]> {
  console.log('Merging projects and tally results...')
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

    const fundingAmount = await round.getAllocatedAmount(
      tallyVotes,
      tallyVoiceCredits
    )

    const project = projectRecords[address]
    projects.push({
      ...project,
      address,
      tallyIndex: i,
      tallyVotes,
      tallyVoiceCredits,
      donationAmount,
      fundingAmount: utils.formatUnits(fundingAmount, decimals),
    })
  }

  return projects
}

/**
 * Audit the tally result for a round
 */
task('fetch-round', 'Fetch round data')
  .addParam('roundAddress', 'Funding round contract address')
  .addParam('output', 'Output pathname')
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
      { roundAddress, output, startBlock, endBlock, blocksPerBatch },
      { ethers, network }
    ) => {
      console.log('Processing on ', network.name)
      console.log('Funding round address', roundAddress)

      const round = await ethers.getContractAt('FundingRound', roundAddress)
      const nativeToken = await round.nativeToken()
      const token = await ethers.getContractAt('ERC20', nativeToken)
      const decimals = await token.decimals()
      const symbol = await token.symbol()
      const contributorCount = await round.contributorCount()
      const matchingPoolSize = await round.matchingPoolSize()
      const totalSpent = await round.totalSpent()
      const voiceCreditFactor = await round.voiceCreditFactor()
      const isFinalized = await round.isFinalized()
      const isCancelled = await round.isCancelled()
      let tallyHash = ''
      let tally: any

      if (isFinalized && !isCancelled) {
        tallyHash = await round.tallyHash()
        tally = await fetchTally(tallyHash)
      }

      const maciAddress = await round.maci()
      const maci = await ethers.getContractAt('MACI', maciAddress)
      const startTime = await maci.signUpTimestamp()
      const signUpDuration = await maci.signUpDurationSeconds()
      const votingDuration = await maci.votingDurationSeconds()
      const endTime = startTime.add(signUpDuration).add(votingDuration)

      const recipientRegistryAddress = await round.recipientRegistry()
      const recipientRegistry = await ethers.getContractAt(
        'OptimisticRecipientRegistry',
        recipientRegistryAddress
      )

      // fetch event logs containing project information
      const submitFilter = recipientRegistry.filters.RequestSubmitted()
      const resolveFilter = recipientRegistry.filters.RequestResolved()
      const lastBlock = endBlock
        ? endBlock
        : await ethers.provider.getBlockNumber()

      console.log('Fetching SubmitRequest event logs...')
      const submitLogs = await fetchLogs({
        provider: ethers.provider,
        filter: submitFilter,
        startBlock,
        lastBlock,
        blocksPerBatch,
      })

      if (submitLogs.length > 0) {
        console.log(
          `Fetched ${submitLogs.length} SubmitRequest logs from blocks ${
            logsFirstBlock(submitLogs) || ''
          } to ${logsLastBlock(submitLogs) || ''}`
        )
      } else {
        console.log('SubmitRequest logs not found')
      }

      console.log('Fetching ResolveRequest event logs...')
      const resolveLogs = await fetchLogs({
        provider: ethers.provider,
        filter: resolveFilter,
        startBlock,
        lastBlock,
        blocksPerBatch,
      })
      if (resolveLogs.length > 0) {
        console.log(
          `Fetched ${resolveLogs.length} ResolvedRequest logs from blocks ${
            logsFirstBlock(resolveLogs) || ''
          } to ${logsLastBlock(resolveLogs) || ''}`
        )
      } else {
        console.log('ResolvedRequest logs not found')
      }

      const projectRecords = await genProjectRecords({
        submitLogs,
        resolveLogs,
        recipientRegistry,
      })

      const projects =
        isFinalized && !isCancelled
          ? processFinalizedRound({
              round,
              recipientRegistry,
              projectRecords,
              decimals,
              startTime,
              endTime,
              tally,
              voiceCreditFactor,
            })
          : Object.values(projectRecords)

      const outputString = JSON.stringify(
        {
          round: {
            address: roundAddress,
            isFinalized,
            isCancelled,
            nativeToken: { symbol, decimals: decimals.toString() },
            totalSpent: totalSpent.toString(),
            voiceCreditFactor: voiceCreditFactor.toString(),
            matchingPoolSize: matchingPoolSize.toString(),
            contributorCount: contributorCount.toString(),
            startTime: startTime.toString(),
            endTime: endTime.toString(),
            tallyHash,
          },
          projects,
          tally,
        },
        null,
        2
      )

      fs.writeFileSync(output, outputString)
      console.log('Finished writing results to', output)
    }
  )
