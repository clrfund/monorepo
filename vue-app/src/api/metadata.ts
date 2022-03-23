import { MetadataComposer, SearchOptions } from '@yuetloo/metadata-composer'
import { ContractTransaction, providers, ContractReceipt } from 'ethers'
import { METADATA_NETWORKS, METADATA_SUBGRAPH_URL_PREFIX, chain } from './core'
import { Project } from './projects'
import { Ipfs } from './ipfs'
import { resolveEns } from '@/utils/accounts'
import { RecipientApplicationData } from './recipient'

const urls = METADATA_NETWORKS.map(
  (network) => `${METADATA_SUBGRAPH_URL_PREFIX}${network}`
)

const composer = new MetadataComposer(urls)

const GET_METADATA_BATCH_QUERY = `
  query($ids: [String]) {
    metadataEntries(where: { id_in: $ids }) {
      id
      metadata
    }
  }
`

/**
 * Extract address for the given chain
 * @param receivingAddresses array of EIP-3770 addresses, i.e. eth:0x11111...
 * @param chainShortName chain short name
 * @returns address for the chain
 */
function getAddressForChain(
  receivingAddresses: string[] = [],
  chainShortName: string
): string {
  const chainAddresses = receivingAddresses.reduce((addresses, data) => {
    const [chainName, address] = data.split(':')
    addresses[chainName] = address
    return addresses
  }, {})

  return chainAddresses[chainShortName]
}

/**
 * Parse and populate receiving addresses
 * @param data data containing receivingAddresses
 * @returns metadata populated with resolvedAddress and addressName
 */
async function populateAddresses(data: any): Promise<Metadata> {
  const addressName = getAddressForChain(
    data.receivingAddresses,
    chain.shortName
  )

  let hasEns = false
  let resolvedAddress = addressName
  if (addressName) {
    let res: string | null = null
    try {
      res = await resolveEns(addressName)
    } catch {
      // ignore error, the application should
      // flag this as missing required field
    }
    hasEns = !!res
    resolvedAddress = res ? res : addressName
  }

  return {
    ...data,
    hasEns,
    addressName,
    resolvedAddress,
  }
}

/**
 * Metadata class
 */
export class Metadata {
  id?: string
  name?: string
  owner?: string
  receivingAddresses?: string[]
  addressName?: string
  resolvedAddress?: string
  hasEns: boolean
  tagline?: string
  description?: string
  category?: string
  problemSpace?: string
  plans?: string
  teamName?: string
  teamDescription?: string
  teamEmail?: string
  githubUrl?: string
  radicleUrl?: string
  websiteUrl?: string
  twitterUrl?: string
  discordUrl?: string
  bannerImageHash?: string
  thumbnailImageHash?: string
  imageHash?: string

  constructor(data: any) {
    this.id = data.id
    this.name = data.name
    this.owner = data.owner
    this.receivingAddresses = data.receivingAddresses
    this.hasEns = !!data.hasEns
    this.tagline = data.tagline
    this.description = data.description
    this.category = data.category
    this.problemSpace = data.problemSpace
    this.plans = data.plans
    this.teamName = data.teamName
    this.teamDescription = data.teamDescription
    this.teamEmail = data.teamEmail
    this.githubUrl = data.githubUrl
    this.radicleUrl = data.radicleUrl
    this.websiteUrl = data.websiteUrl
    this.twitterUrl = data.twitterUrl
    this.discordUrl = data.discordUrl
    this.bannerImageHash = data.bannerImageHash
    this.thumbnailImageHash = data.thumbnailImageHash
    this.imageHash = data.imageHash
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
    const result = await composer.get(id)
    if (result.error) {
      throw new Error(result.error)
    }

    const { data } = result
    if (!data) {
      return null
    }

    const arg = await populateAddresses(data)
    return new Metadata({ ...arg })
  }

  /**
   * get metadata given an array of metadata ids
   * @param ids array of metadata id
   * @returns a list of metadata
   */
  static async getBatch(ids: string[]): Promise<any[]> {
    const result = await composer.query(GET_METADATA_BATCH_QUERY, { ids })
    if (result.error) {
      throw new Error(result.error)
    }

    return result.data?.metadataEntries || []
  }

  /**
   * get the receiving address of the current chain
   * @param addresses list of EIP3770 addresses
   * @returns the address of the current chain
   */
  getCurrentChainAddress(addresses: string[] = []): string {
    const chainPrefix = chain.shortName + ':'
    const chainAddress = addresses.find((addr) => {
      return addr.startsWith(chainPrefix)
    })

    return chainAddress ? chainAddress.substring(chainPrefix.length) : ''
  }

  /**
   * Convert metadata to project interface
   * @returns project
   */
  toProject(): Project {
    const address = this.getCurrentChainAddress(this.receivingAddresses)
    return {
      id: this.id || '',
      address,
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
      bannerImageUrl: Ipfs.toUrl(this.bannerImageHash),
      thumbnailImageUrl: Ipfs.toUrl(this.thumbnailImageHash),
      imageUrl: Ipfs.toUrl(this.imageHash),
      index: 0,
      isHidden: false,
      isLocked: false,
    }
  }

  /**
   * Convert metadata to form data
   * @returns recipient application form data
   */
  toFormData(): RecipientApplicationData {
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
        addressName: '',
        resolvedAddress: '',
        plans: this.plans || '',
      },
      team: {
        name: this.teamName || '',
        description: this.teamDescription || '',
        email: this.teamEmail || '',
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
      furthestStep: 0,
      hasEns: this.hasEns || false,
      id: this.id,
    }
  }

  /**
   * Convert recipient form data to Metadata
   * @param data recipient application form data
   * @returns Metadata
   */
  static fromFormData(data: RecipientApplicationData): Metadata {
    const { id, project, fund, team, links, image } = data
    return new Metadata({
      id,
      name: project.name,
      tagline: project.tagline,
      description: project.description,
      category: project.category,
      problemSpace: project.problemSpace,
      plans: fund.plans,
      receivingAddresses: fund.receivingAddresses,
      teamName: team.name,
      teamDescription: team.description,
      teamEmail: team.email,
      githubUrl: links.github,
      radicleUrl: links.radicle,
      websiteUrl: links.website,
      twitterUrl: links.twitter,
      discordUrl: links.discord,
      bannerImageHash: image.bannerHash,
      thumbnailImageHash: image.thumbnailHash,
    })
  }

  /**
   * Create a metadata in the registry
   * @param web3 EIP1193 web3 provider used to sign the transaction
   * @returns transaction handle
   */
  async create(web3: providers.Web3Provider): Promise<ContractTransaction> {
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
    const metadata = { ...this, target: this.id }
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
    return composer.delete(this.id, web3.provider)
  }

  /**
   * Get metadata id from the receipt
   * @param receipt receipt containing the metadata transaction
   * @returns metadata id
   */
  static getMetadataId(receipt: ContractReceipt): string {
    const event = (receipt.events || []).find((e) => e.event === 'NewPost')
    return `${chain.subgraphNetwork}-${receipt.transactionHash}-${event?.logIndex}`
  }
}
