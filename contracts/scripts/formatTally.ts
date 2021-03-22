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

function decodeRecipientAdded(event: Event): Project {
  const args = event.args as any
  try {
    const decodedMetadata = JSON.parse(args._metadata)
    return {
      id: args._recipient,
      name: decodedMetadata.name,
      index: args._index.toNumber(),
    }
  } catch (error) {
    return {
      id: args._recipient,
      name: 'dummy',
      index: args._index.toNumber(),
    }
  }
}

async function main() {
  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    '0xbEa5c36F8aE453a46B90038788FF025855e8b5E3',
  )
  const startBlock = await fundingRound.startBlock()
  const maci = await ethers.getContractAt('MACI', await fundingRound.maci())
  const signUpDuration = await maci.signUpDurationSeconds()
  const votingDuration = await maci.votingDurationSeconds()
  const endBlock = startBlock.add((signUpDuration.add(votingDuration)).div(5))
  const tallyHash = 'QmVwLkkdo3iMpga9mrW7k91EHRrmku53XVxmPJKCqaz8G4'
  const tallyResponse = await fetch(`${ipfsGatewayUrl}/ipfs/${tallyHash}`)
  const tally = await tallyResponse.json()
  const registry = await ethers.getContractAt(
    'SimpleRecipientRegistry',
    await fundingRound.recipientRegistry(),
  )
  const recipientAddedFilter = registry.filters.RecipientAdded()
  const recipientAddedEvents = await registry.queryFilter(recipientAddedFilter, 0)
  const recipientRemovedFilter = registry.filters.RecipientRemoved()
  const recipientRemovedEvents = await registry.queryFilter(recipientRemovedFilter, 0)
  const projects: Project[] = []
  for (const event of recipientAddedEvents) {
    const project = decodeRecipientAdded(event)
    if (event.blockNumber >= endBlock.toNumber()) {
      continue
    }
    const removed = recipientRemovedEvents.find((event) => {
      return (event.args as any)._recipient === project.id
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
