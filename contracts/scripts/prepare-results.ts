import fetch from 'node-fetch'
import { ethers } from 'hardhat'
import { Event } from 'ethers'
import { gtcrDecode } from '@kleros/gtcr-encoder'

const ipfsGatewayUrl = 'https://ipfs.io/'

interface Project {
  id: string;
  name: string;
  index: number;
  result?: number;
  spent?: number;
}

interface TcrColumn {
  label: string;
  type: string;
}

function decodeRecipientAdded(event: Event, columns: TcrColumn[]): Project {
  const args = event.args as any
  const consoleError = console.error
  console.error = function () {} // eslint-disable-line @typescript-eslint/no-empty-function
  const decodedMetadata = gtcrDecode({ columns, values: args._metadata })
  console.error = consoleError
  /* eslint-enable no-console */
  return {
    id: args._tcrItemId,
    name: decodedMetadata[0] as string,
    index: args._index.toNumber(),
  }
}

async function main() {
  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    process.env.ROUND_ADDRESS as string,
  )
  const startBlock = await fundingRound.startBlock()
  const maci = await ethers.getContractAt('MACI', await fundingRound.maci())
  const signUpDuration = await maci.signUpDurationSeconds()
  const votingDuration = await maci.votingDurationSeconds()
  const endBlock = startBlock.add((signUpDuration.add(votingDuration)).div(15))
  const tallyHash = await fundingRound.tallyHash()
  const tallyResponse = await fetch(`${ipfsGatewayUrl}/ipfs/${tallyHash}`)
  const tally = await tallyResponse.json()
  const registry = await ethers.getContractAt(
    'KlerosGTCRAdapter',
    await fundingRound.recipientRegistry(),
  )
  const tcr = await ethers.getContractAt(
    'KlerosGTCRMock',
    await registry.tcr(),
  )
  const metaEvidenceFilter = tcr.filters.MetaEvidence()
  const metaEvidenceEvents = await tcr.queryFilter(metaEvidenceFilter, 0)
  const regMetaEvidenceEvent = metaEvidenceEvents[metaEvidenceEvents.length - 2]
  const tcrEvidenceIpfsPath = (regMetaEvidenceEvent.args as any)._evidence
  const tcrDataResponse = await fetch(`${ipfsGatewayUrl}${tcrEvidenceIpfsPath}`)
  const tcrData = await tcrDataResponse.json()
  const tcrColumns = tcrData.metadata.columns
  const recipientAddedFilter = registry.filters.RecipientAdded()
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0)
  const recipientRemovedFilter = registry.filters.RecipientRemoved()
  const recipientRemovedEvents = await registry.queryFilter(recipientRemovedFilter, 0)
  const projects: Project[] = []
  for (const event of recipientAddedEvents) {
    const project = decodeRecipientAdded(event, tcrColumns)
    if (event.blockNumber >= endBlock.toNumber()) {
      continue
    }
    const removed = recipientRemovedEvents.find((event) => {
      return (event.args as any)._tcrItemId === project.id
    })
    if (removed) {
      continue
    }
    project.result = parseInt(tally.results.tally[project.index])
    project.spent = parseInt(tally.totalVoiceCreditsPerVoteOption.tally[project.index])
    projects.push(project)
  }
  console.log(JSON.stringify(projects))
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
