import { ethers } from 'hardhat'
import { Contract, Signer } from 'ethers'
import { RecipientRegistryConstructorArgs } from './types'

export class SimpleRecipientRegistryFactory {
  static async deploy(
    args: RecipientRegistryConstructorArgs,
    signer: Signer
  ): Promise<Contract> {
    const SimpleRecipientRegistry = await ethers.getContractFactory(
      'SimpleRecipientRegistry',
      signer
    )

    const recipientRegistry = await SimpleRecipientRegistry.deploy(
      args.controller
    )

    return recipientRegistry
  }
}
