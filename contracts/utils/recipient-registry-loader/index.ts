import { Contract } from 'ethers'
import { Recipient } from './types'
import { OptimisticRecipientRegistryLoader } from './optimistic'
import { SimpleRecipientRegistryLoader } from './simple'
import { TestMetadata } from '../test-metadata'

const LoaderMap: Record<string, Function> = {
  simple: SimpleRecipientRegistryLoader.load,
  optimistic: OptimisticRecipientRegistryLoader.load,
}

export class RecipientRegistryLoader {
  static async load(
    registryType: string,
    registry: Contract,
    recipients: Recipient[]
  ) {
    const loader = LoaderMap[registryType]
    if (loader) {
      await loader(registry, recipients)
    }
  }

  static buildStubRecipients(recipients: string[]): Recipient[] {
    return recipients.map((recipient, i) => {
      return { address: recipient, metadata: TestMetadata[i] }
    })
  }
}
