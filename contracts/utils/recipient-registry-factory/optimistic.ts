import { ethers } from 'hardhat'
import { Contract, Signer } from 'ethers'
import { RecipientRegistryConstructorArgs } from './types'

export class OptimisticRecipientRegistryFactory {
  static async deploy(
    args: RecipientRegistryConstructorArgs,
    signer: Signer
  ): Promise<Contract> {
    if (args.baseDeposit === undefined) {
      throw new Error('missing base deposit ')
    }
    if (args.challengePeriodDuration === undefined) {
      throw new Error('missing challenge period duration')
    }

    const OptimisticRecipientRegistry = await ethers.getContractFactory(
      'OptimisticRecipientRegistry',
      signer
    )

    const recipientRegistry = await OptimisticRecipientRegistry.deploy(
      args.baseDeposit,
      args.challengePeriodDuration,
      args.controller
    )

    return recipientRegistry
  }
}
