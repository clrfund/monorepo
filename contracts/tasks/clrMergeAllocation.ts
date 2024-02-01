/**
 * For cancelled rounds, merge the allocation data to the round JSON file
 * This task must be run after the export-round task as this is merging
 * data into the output file of the export-round task
 *
 * Sample usage:
 * yarn hardhat clr-merge-allocations --allocation-file /tmp/downloads/clr.fund-round8.tsv --round-file ../vue-app/src/rounds/xdai/0xd07aa7faeba14efde87f2538699c0d6c9a566c20.json
 */

import { task, types } from 'hardhat/config'
import { formatUnits, parseUnits } from 'ethers'
import fs from 'fs'
import { Project, RoundFileContent, Tally } from '../utils/types'
import { JSONFile } from '../utils/JSONFile'

const COLUMN_PROJECT_NAME = 0
const COLUMN_RECIPIENT_ADDRESS = 1
const COLUMN_VOTES = 2
const COLUMN_PAYOUT_AMOUNT = 4

type Allocation = {
  projectName: string
  recipientAddress: string
  votes: string
  payoutAmount: string
}

/**
 * Map null in the array to zero
 * @param array array to check for null and map nulls to zero
 * @returns array with null mapped to zero
 */
function mapNullToZero(array: string[]): string[] {
  return array.map((item) => (item === null ? '0' : item))
}

/**
 * Map nulls in the tally data to zero
 * @param tally tally data
 * @returns sanitized tally data
 */
function sanitizeTally(tally: Tally): Tally {
  tally.results.tally = mapNullToZero(tally.results.tally)
  tally.totalVoiceCreditsPerVoteOption.tally = mapNullToZero(
    tally.totalVoiceCreditsPerVoteOption.tally
  )
  return tally
}

/**
 * Make the key used to lookup a project from the project records
 * @param address recipient address
 * @param state recipient state, e.g. Aceepted or Removed
 * @returns the key
 */
function makeProjectKey(address: string, state = 'Accepted'): string {
  const key = address ? `${state}-${address}` : ''
  return key.toLowerCase()
}

/**
 *
 * @param roundFile the JSON file containing round data
 * @returns
 */
function readRoundFile(roundFile: string): RoundFileContent | null {
  const roundString = fs.readFileSync(roundFile, { encoding: 'utf8' })
  let roundData: RoundFileContent | null = null
  try {
    roundData = JSON.parse(roundString)
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    console.error('Error parsing JSON file', roundFile, message)
  }
  return roundData
}

/**
 * Read the allocation file and return the allocations data
 * @param allocationFile allocation file in tab separated format
 * @param skipAllocationRows how many rows to skip to get to the actual data row
 * @returns allocations
 */
function readAllocationFile(
  allocationFile: string,
  skipAllocationRows: number
): Allocation[] {
  const allocations: Allocation[] = []

  const allocationData = fs.readFileSync(allocationFile, { encoding: 'utf8' })
  const rows = allocationData.split('\n')
  let rowCount = 0
  for (const row of rows) {
    rowCount++
    if (rowCount <= skipAllocationRows) {
      continue
    }

    const columns = row.split('\t')
    const projectName = columns[COLUMN_PROJECT_NAME]
    const recipientAddress = columns[COLUMN_RECIPIENT_ADDRESS]
    const votes = columns[COLUMN_VOTES]
    const payoutAmount = columns[COLUMN_PAYOUT_AMOUNT]

    if (!recipientAddress) {
      // last row is empty
      continue
    }

    allocations.push({ projectName, recipientAddress, votes, payoutAmount })
  }

  return allocations
}

task(
  'clr-merge-allocations',
  'Merge the allocations data into the round JSON file'
)
  .addParam('roundFile', 'The JSON file exported from the export-round task')
  .addParam('allocationFile', 'The allocation file in tab separated format')
  .addOptionalParam(
    'skipAllocationRows',
    'Skip the first n rows in the allocation file',
    3,
    types.int
  )
  .setAction(async ({ roundFile, allocationFile, skipAllocationRows }) => {
    const roundData = readRoundFile(roundFile)
    if (!roundData) {
      return
    }

    console.log('Funding round address', roundData.round.address)
    console.log(
      `Skip the first ${skipAllocationRows} rows in the allocation file`
    )

    const allocations = readAllocationFile(allocationFile, skipAllocationRows)
    const decimals = roundData?.round.nativeTokenDecimals

    const projects = roundData.projects.reduce(
      (projectRecords: Record<string, Project>, project) => {
        const { recipientAddress, state } = project
        if (recipientAddress) {
          const key = makeProjectKey(recipientAddress, state)
          projectRecords[key] = project
        }
        return projectRecords
      },
      {}
    )

    const tally: Tally = roundData.tally || {
      results: { tally: [] },
      totalVoiceCreditsPerVoteOption: { tally: [] },
    }

    let totalPayout = BigInt(0)
    for (let index = 0; index < allocations.length; index++) {
      const { recipientAddress, projectName, payoutAmount, votes } =
        allocations[index]
      if (!recipientAddress) {
        // last row is empty
        continue
      }

      if (!payoutAmount) {
        console.log(`Row ${index}`, `missing payout for ${projectName}`)
        continue
      }

      const allocatedAmountBN = parseUnits(payoutAmount, decimals)
      const allocatedAmount = allocatedAmountBN.toString()
      const projectKey = makeProjectKey(recipientAddress)
      if (projects[projectKey]) {
        projects[projectKey].allocatedAmount = allocatedAmount
        console.log(index, projectName, '-', payoutAmount)
        totalPayout = totalPayout + BigInt(allocatedAmount)

        const { recipientIndex } = projects[projectKey]
        if (recipientIndex) {
          tally.results.tally[recipientIndex] = votes.replace(/,/gi, '')
          // TODO: see if we can retrieve this information from subgraph
          tally.totalVoiceCreditsPerVoteOption.tally[recipientIndex] = '0'
        }
      } else {
        console.error(index, `project ${projectName} not found`)
      }
    }

    if (
      roundData &&
      Object.keys(projects).length > 0 &&
      totalPayout > BigInt(0)
    ) {
      roundData.projects = Object.values(projects)
      console.log('totalPayout ', formatUnits(totalPayout, decimals))

      roundData.round.matchingPoolSize = totalPayout.toString()
      roundData.tally = sanitizeTally(tally)
      JSONFile.write(roundFile, roundData)
      console.log('Finished writing to', roundFile)
    }
  })
