import { ethers } from 'hardhat'
import { Contract, Signer } from 'ethers'
import { RecipientRegistryConstructorArgs } from './types'

export class UniversalRecipientRegistryFactory {
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

    const UniversalRecipientRegistry = await ethers.getContractFactory(
      'UniversalRecipientRegistry',
      signer
    )

    const recipientRegistry = await UniversalRecipientRegistry.deploy(
      args.baseDeposit,
      args.challengePeriodDuration,
      args.controller
    )

    return recipientRegistry
  }
}
