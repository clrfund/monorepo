/**
 * Deploy a new recipient registry
 */

import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { ISubtaskParams } from '../../helpers/types'
import { EContracts } from '../../../utils/types'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask(
    'recipient:deploy-simple-recipient-registry',
    'Deploy a simple recipient regsitry'
  )
  .setAction(async ({ incremental, clrfund }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const recipientRegistryName = subtask.getConfigField<string>(
      EContracts.ClrFund,
      'recipientRegistry'
    )

    if (recipientRegistryName !== EContracts.SimpleRecipientRegistry) {
      return
    }

    const simpleRecipientRegistryContractAddress = storage.getAddress(
      EContracts.SimpleRecipientRegistry,
      hre.network.name
    )

    if (incremental && simpleRecipientRegistryContractAddress) {
      return
    }

    const clrfundContract = await subtask.getContract({
      name: EContracts.ClrFund,
      address: clrfund,
    })

    const clrfundContractAddress = await clrfundContract.getAddress()
    const args = [clrfundContractAddress]
    const simpleRecipientRegistryContract = await subtask.deployContract(
      EContracts.SimpleRecipientRegistry,
      { signer: deployer, args }
    )

    await storage.register({
      id: EContracts.SimpleRecipientRegistry,
      contract: simpleRecipientRegistryContract,
      args,
      network: hre.network.name,
    })
  })
