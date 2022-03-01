import { Contract } from 'ethers'
import { Recipient } from './types'
import { OptimisticRecipientRegistryLoader } from './optimistic'
import { SimpleRecipientRegistryLoader } from './simple'
import { UniversalRecipientRegistryLoader } from './universal'
import { TestMetadata } from '../test-metadata'

const LoaderMap: Record<string, Function> = {
  simple: SimpleRecipientRegistryLoader.load,
  optimistic: OptimisticRecipientRegistryLoader.load,
  universal: UniversalRecipientRegistryLoader.load,
}

const TEST_TX_HASH =
  '0x45af16a2ceb668f92a74e8132814e4e6cd96aaf2544e600adccd7b7efcd785a7'

export class RecipientRegistryLoader {
  static async load(
    registryType: string,
    registry: Contract,
    recipients: Recipient[]
  ): Promise<void> {
    const loader = LoaderMap[registryType]
    if (!loader) {
      throw new Error(`recipient registry type ${registryType} not supported`)
    }

    return loader(registry, recipients)
  }

  static buildStubRecipients(recipients: string[]): Recipient[] {
    return recipients.map((recipient, i) => {
      const metadataId = `rinkeby-${TEST_TX_HASH}-${i}`
      return { address: recipient, metadata: TestMetadata[i], metadataId }
    })
  }
}
