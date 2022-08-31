import { Contract, Signer } from 'ethers'
import { SimpleRecipientRegistryFactory } from './simple'
import { OptimisticRecipientRegistryFactory } from './optimistic'
import { RecipientRegistryConstructorArgs } from './types'

// Map of recipient registry type to the deployment function
const RegistryFactoryMap: Record<string, Function> = {
  simple: SimpleRecipientRegistryFactory.deploy,
  optimistic: OptimisticRecipientRegistryFactory.deploy,
}

/**
 * Recipient Registry Factory to deploy
 */
export class RecipientRegistryFactory {
  static async deploy(
    registryType: string,
    args: RecipientRegistryConstructorArgs,
    signer: Signer
  ): Promise<Contract> {
    const factory = RegistryFactoryMap[registryType]
    if (!factory) {
      throw new Error('unsupported recipient registry type')
    }

    const registry = await factory(args, signer)
    await registry.deployTransaction.wait()
    return registry
  }
}
