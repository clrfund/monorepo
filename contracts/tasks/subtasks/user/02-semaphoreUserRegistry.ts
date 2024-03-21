/**
 * Deploy a semaphore user registry
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
    'user:deploy-semaphore-user-registry',
    'Deploy a semaphore user registry'
  )
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const userRegistryName = subtask.getConfigField<string>(
      EContracts.ClrFund,
      'userRegistry'
    )

    if (userRegistryName !== EContracts.SemaphoreUserRegistry) {
      return
    }

    const semaphoreUserRegistryContractAddress = storage.getAddress(
      EContracts.SemaphoreUserRegistry,
      hre.network.name
    )

    if (incremental && semaphoreUserRegistryContractAddress) {
      return
    }

    const args = []
    const semaphoreUserRegistryContract = await subtask.deployContract(
      EContracts.SemaphoreUserRegistry,
      { signer: deployer, args }
    )

    await storage.register({
      id: EContracts.SemaphoreUserRegistry,
      contract: semaphoreUserRegistryContract,
      args,
      network: hre.network.name,
    })
  })
