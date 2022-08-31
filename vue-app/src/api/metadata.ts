import { MetadataComposer, SearchOptions } from '@clrfund/metadata-composer'
import { ContractTransaction, providers, utils } from 'ethers'
import { METADATA_NETWORKS, METADATA_SUBGRAPH_URL_PREFIX, chain } from './core'
import { Project } from './projects'
import { IPFS } from './ipfs'
import { MAX_RETRIES } from './core'
import { required, url, maxLength } from 'vuelidate/lib/validators'
import * as isIPFS from 'is-ipfs'
import { ReceivingAddress } from '@/api/receiving-address'

const subgraphUrl = (network: string): string =>
  `${METADATA_SUBGRAPH_URL_PREFIX}${network}`

const urls = METADATA_NETWORKS.map((network) => subgraphUrl(network))

const GET_METADATA_BATCH_QUERY = `
  query($ids: [String]) {
    metadataEntries(where: { id_in: $ids }) {
      id
      metadata
    }
  }
`

const GET_LATEST_BLOCK_QUERY = `
{
  _meta {
    block {
      number
    }
  }
}
`

export interface MetadataFormData {
  project: {
    name: string
    tagline: string
    description: string
    category: string
    problemSpace: string
  }
  fund: {
    receivingAddresses: string[]
    currentChainReceivingAddress: string
    plans: string
  }
  team: {
    name: string
    description: string
    email: string
  }
  links: {
    github: string
    radicle: string
    website: string
    twitter: string
    discord: string
  }
  image: {
    bannerHash: string
    thumbnailHash: string
  }
  dirtyFields: Set<string>
  furthestStep: number
  id?: string
  network?: string
  owner?: string
}

export const MetadataFormValidations = {
  project: {
    name: { required },
    tagline: {
      required,
      maxLength: maxLength(140),
    },
    description: { required },
    category: { required },
    problemSpace: { required },
  },
  fund: {
    receivingAddresses: {},
    currentChainReceivingAddress: {
      required,
      validEthAddress: utils.isAddress,
    },
    plans: { required },
  },
  team: {
    name: {},
    description: {},
  },
  links: {
    github: { url },
    radicle: { url },
    website: { url },
    twitter: { url },
    discord: { url },
  },
  image: {
    bannerHash: {
      required,
      validIpfsHash: isIPFS.cid,
    },
    thumbnailHash: {
      required,
      validIpfsHash: isIPFS.cid,
    },
  },
}

/**
 * Extract address for the current chain from the fund receiving addresses
 * @param receivingAddresses array of EIP-3770 addresses, i.e. eth:0x11111...
 * @returns address for the current chain
 */
function getAddressForCurrentChain(receivingAddresses: string[] = []): string {
  const addresses = ReceivingAddress.fromArray(receivingAddresses)
  return addresses[chain.shortName]
}

/**
 * Get the latest block from subgraph
 * @returns block number
 */
async function getLatestBlock(network: string): Promise<number> {
  // only interested in the latest block from the specified network
  const url = subgraphUrl(network)
  const composer = new MetadataComposer([url])
  const result = await composer.query(GET_LATEST_BLOCK_QUERY)
  if (result.error) {
    throw new Error('Failed to get latest block from subgraph. ' + result.error)
  }

  const [meta] = result.data._meta
  if (!meta) {
    throw new Error('Missing block information')
  }

  return meta.block.number
}

function sleep(factor: number): Promise<void> {
  const timeout = factor ** 2 * 1000
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

/**
 * Metadata class
 */
export class Metadata {
  id?: string
  name?: string
  owner?: string
  network?: string
  receivingAddresses?: string[]
  currentChainReceivingAddress?: string
  tagline?: string
  description?: string
  category?: string
  problemSpace?: string
  plans?: string
  teamName?: string
  teamDescription?: string
  githubUrl?: string
  radicleUrl?: string
  websiteUrl?: string
  twitterUrl?: string
  discordUrl?: string
  bannerImageHash?: string
  thumbnailImageHash?: string
  imageHash?: string
  deletedAt?: number
  furthestStep?: number
  email?: string

  constructor(data: any) {
    this.id = data.id
    this.name = data.name
    this.owner = data.owner
    this.network = data.network
    this.receivingAddresses = data.receivingAddresses
    this.currentChainReceivingAddress = getAddressForCurrentChain(
      data.receivingAddresses
    )
    this.tagline = data.tagline
    this.description = data.description
    this.category = data.category
    this.problemSpace = data.problemSpace
    this.plans = data.plans
    this.teamName = data.teamName
    this.teamDescription = data.teamDescription
    this.githubUrl = data.githubUrl
    this.radicleUrl = data.radicleUrl
    this.websiteUrl = data.websiteUrl
    this.twitterUrl = data.twitterUrl
    this.discordUrl = data.discordUrl
    this.bannerImageHash = data.bannerImageHash
    this.thumbnailImageHash = data.thumbnailImageHash
    this.imageHash = data.imageHash
    this.furthestStep = data.furthestStep
    this.email = data.email
  }

  /**
   * Search metadata by search text
   * @param searchText search for metadata containing this text
   * @param options first - option to limit search result
   *                activeOnly - option to search only active metadata (not deleted)
   * @returns array of metadata
   */
  static async search(
    searchText: string,
    options: SearchOptions
  ): Promise<Metadata[]> {
    const composer = new MetadataComposer(urls)
    const result = await composer.search(searchText, options)
    if (result.error) {
      throw new Error(result.error)
    }

    const { data = [] } = result
    return data.map((entry) => new Metadata(entry))
  }

  /**
   * Get metadata by id
   * @param id metadata id
   * @returns metadata
   */
  static async get(id: string): Promise<Metadata | null> {
    const composer = new MetadataComposer(urls)
    const result = await composer.get(id)
    const { data } = result
    if (!data) {
      // id not found
      return null
    }

    return new Metadata({ ...data })
  }

  /**
   * get metadata given an array of metadata ids
   * @param ids array of metadata id
   * @returns a list of metadata
   */
  static async getBatch(ids: string[]): Promise<any[]> {
    const composer = new MetadataComposer(urls)
    const result = await composer.query(GET_METADATA_BATCH_QUERY, { ids })
    if (result.error) {
      throw new Error(result.error)
    }

    return result.data?.metadataEntries || []
  }

  /**
   * Convert metadata to project interface
   * @returns project
   */
  toProject(): Project {
    return {
      id: this.id || '',
      address: this.currentChainReceivingAddress || '',
      name: this.name || '',
      tagline: this.tagline,
      description: this.description || '',
      category: this.category,
      problemSpace: this.problemSpace,
      plans: this.plans,
      teamName: this.teamName,
      teamDescription: this.teamDescription,
      githubUrl: this.githubUrl,
      radicleUrl: this.radicleUrl,
      websiteUrl: this.websiteUrl,
      twitterUrl: this.twitterUrl,
      discordUrl: this.discordUrl,
      bannerImageUrl: IPFS.toUrl(this.bannerImageHash),
      thumbnailImageUrl: IPFS.toUrl(this.thumbnailImageHash),
      imageUrl: IPFS.toUrl(this.imageHash),
      index: 0,
      isHidden: false,
      isLocked: false,
    }
  }

  /**
   * Convert metadata to form data
   * @returns recipient application form data
   */
  toFormData(): MetadataFormData {
    return {
      project: {
        name: this.name || '',
        tagline: this.tagline || '',
        description: this.description || '',
        category: this.category || '',
        problemSpace: this.problemSpace || '',
      },
      fund: {
        receivingAddresses: this.receivingAddresses || [],
        currentChainReceivingAddress:
          getAddressForCurrentChain(this.receivingAddresses) || '',
        plans: this.plans || '',
      },
      team: {
        name: this.teamName || '',
        description: this.teamDescription || '',
        email: this.email || '',
      },
      links: {
        github: this.githubUrl || '',
        radicle: this.radicleUrl || '',
        website: this.websiteUrl || '',
        twitter: this.twitterUrl || '',
        discord: this.discordUrl || '',
      },
      image: {
        bannerHash: this.bannerImageHash || '',
        thumbnailHash: this.thumbnailImageHash || '',
      },
      dirtyFields: new Set(),
      furthestStep: 0,
      id: this.id,
      owner: this.owner,
      network: this.network,
    }
  }

  /**
   * Convert form data to Metadata
   * @param data form data
   * @param dirtyOnly only set the field in metadata if it's changed
   * @returns Metadata
   */
  static fromFormData(data: MetadataFormData, dirtyOnly = false): Metadata {
    const { id, project, fund, team, links, image } = data
    const metadata = new Metadata({ id })

    if (!dirtyOnly || data.dirtyFields.has('project.name')) {
      metadata.name = project.name
    }
    if (!dirtyOnly || data.dirtyFields.has('project.tagline')) {
      metadata.tagline = project.tagline
    }
    if (!dirtyOnly || data.dirtyFields.has('project.description')) {
      metadata.description = project.description
    }
    if (!dirtyOnly || data.dirtyFields.has('project.category')) {
      metadata.category = project.category
    }
    if (!dirtyOnly || data.dirtyFields.has('project.problemSpace')) {
      metadata.problemSpace = project.problemSpace
    }
    if (!dirtyOnly || data.dirtyFields.has('fund.plans')) {
      metadata.plans = fund.plans
    }
    if (!dirtyOnly || data.dirtyFields.has('fund.receivingAddresses')) {
      metadata.receivingAddresses = fund.receivingAddresses
    }
    if (!dirtyOnly || data.dirtyFields.has('team.name')) {
      metadata.teamName = team.name
    }
    if (!dirtyOnly || data.dirtyFields.has('team.description')) {
      metadata.teamDescription = team.description
    }
    if (!dirtyOnly || data.dirtyFields.has('links.github')) {
      metadata.githubUrl = links.github
    }
    if (!dirtyOnly || data.dirtyFields.has('links.radicle')) {
      metadata.radicleUrl = links.radicle
    }
    if (!dirtyOnly || data.dirtyFields.has('links.website')) {
      metadata.websiteUrl = links.website
    }
    if (!dirtyOnly || data.dirtyFields.has('links.twitter')) {
      metadata.twitterUrl = links.twitter
    }
    if (!dirtyOnly || data.dirtyFields.has('links.discord')) {
      metadata.discordUrl = links.discord
    }
    if (!dirtyOnly || data.dirtyFields.has('image.bannerHash')) {
      metadata.bannerImageHash = image.bannerHash
    }
    if (!dirtyOnly || data.dirtyFields.has('image.thumbnailHash')) {
      metadata.thumbnailImageHash = image.thumbnailHash
    }
    if (!dirtyOnly) {
      metadata.network = data.network
      metadata.owner = data.owner
    }

    return metadata
  }

  /**
   * Create a metadata in the registry
   * @param web3 EIP1193 web3 provider used to sign the transaction
   * @returns transaction handle
   */
  async create(web3: providers.Web3Provider): Promise<ContractTransaction> {
    const composer = new MetadataComposer(urls)
    return composer.create(this, web3.provider)
  }

  /**
   * Update metadata in the registry
   * @param web3 provider used to sign the transaction
   * @returns transaction handle
   */
  async update(web3: providers.Web3Provider): Promise<ContractTransaction> {
    if (!this.id) {
      throw new Error('Unable to update metadata, id missing')
    }
    const metadata = { ...this }
    const composer = new MetadataComposer(urls)
    return composer.update(metadata, web3.provider)
  }

  /**
   * Delete metadata to registry
   * @param web3 provider used to sign the delete transaction
   * @returns transaction handle
   */
  async delete(web3: providers.Web3Provider): Promise<ContractTransaction> {
    if (!this.id) {
      throw new Error('Unable to delete metadata, id missing')
    }
    const composer = new MetadataComposer(urls)
    return composer.delete(this.id, web3.provider)
  }

  /**
   * Get metadata id from the receipt
   * @param receipt receipt containing the metadata transaction
   * @returns metadata id
   */
  static makeMetadataId(name: string, owner: string): string {
    const networkHash = utils.id(chain.name)
    const nameHash = utils.id(name)
    const hashes = utils.hexConcat([networkHash, owner, nameHash])
    const id = utils.keccak256(hashes)
    return id
  }

  static async waitForBlock(
    blockNumber: number,
    network: string,
    depth = 0,
    callback: (latest: number, total: number) => void
  ): Promise<number> {
    const latestBlock = await getLatestBlock(network)
    callback(latestBlock, blockNumber)
    if (latestBlock < blockNumber) {
      if (depth > MAX_RETRIES) {
        throw new Error('Waited too long for block ' + blockNumber)
      }
      await sleep(depth)
      return Metadata.waitForBlock(blockNumber, network, depth + 1, callback)
    } else {
      return latestBlock
    }
  }
}
