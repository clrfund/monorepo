/**
 * This script is used for auditing the tally result for a round
 *
 * Sample usage:
 * yarn hardhat audit-tally --round-address 0x4a2d90844eb9c815ef10db0371726f0ceb2848b0 --network arbitrum --output ./ethcolombia.json
 */

import { task, types } from 'hardhat/config'
import { Contract, EventFilter, type Log, type Provider } from 'ethers'
import { Ipfs } from '../utils/ipfs'
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
}

function isRemoval(state: number): boolean {
  return state === 1
}

async function fetchLogs({
  provider,
  filter,
  startBlock,
  lastBlock,
  blocksPerBatch,
}: {
  provider: Provider
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
      try {
        const metadata = JSON.parse(args._metadata)
        name = metadata.name
        // eslint-disable-next-line no-empty
      } catch {}

      requests[recipientId] = {
        id: recipientId,
        recipientIndex,
        address: args._recipient,
        name,
        state,
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

function tsvStringify(projects: Project[]): string {
  const firstRow =
    `projectIndex` +
    `\tstate` +
    `\tprojectId` +
    `\taddress` +
    `\tprojectName` +
    `\tvotes` +
    `\tvoiceCreditsSpent` +
    `\tdonationAmount` +
    `\tfundingAmount`

  const outputString = projects.reduce((output, project) => {
    const row =
      `\n${project.tallyIndex || ''}` +
      `\t${project.state || ''}` +
      `\t${project.id || ''}` +
      `\t${project.address || ''}` +
      `\t${project.name || ''}` +
      `\t${project.tallyVotes || ''}` +
      `\t${project.tallyVoiceCredits || ''}` +
      `\t${project.donationAmount || ''}` +
      `\t${project.fundingAmount || ''}`
    return output.concat(row)
  }, firstRow)

  return outputString
}

task('audit-tally', 'Audit the tally result for a round')
  .addParam('roundAddress', 'Funding round contract address')
  .addParam('output', 'Output file path')
  .addOptionalParam('ipfs', 'The IPFS gateway url')
  .addOptionalParam(
    'tsv',
    'Create tab seperated values as output file format, default JSON format',
    false,
    types.boolean
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
      { roundAddress, output, tsv, ipfs, startBlock, endBlock, blocksPerBatch },
      { ethers, network }
    ) => {
      console.log('Processing on ', network.name)
      console.log('Funding round address', roundAddress)

      const round = await ethers.getContractAt('FundingRound', roundAddress)
      const voiceCreditFactor = await round.voiceCreditFactor()
      const nativeToken = await round.nativeToken()
      const token = await ethers.getContractAt('ERC20', nativeToken)
      const decimals = await token.decimals()

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
      console.log(`Fetched ${submitLogs.length} SubmitRequest logs`)

      console.log('Fetching ResolveRequest event logs...')
      const resolveLogs = await fetchLogs({
        provider: ethers.provider,
        filter: resolveFilter,
        startBlock,
        lastBlock,
        blocksPerBatch,
      })
      console.log(`Fetched ${resolveLogs.length} ResolvedRequest logs`)

      const projectRecords = await genProjectRecords({
        submitLogs,
        resolveLogs,
        recipientRegistry,
      })

      const tallyHash = await round.tallyHash()
      const tally = await Ipfs.fetchJson(tallyHash, ipfs)

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

      const outputString = tsv
        ? tsvStringify(projects)
        : JSON.stringify(projects, null, 2)

      fs.writeFileSync(output, outputString)
      console.log('Finished writing results to', output)
    }
  )
