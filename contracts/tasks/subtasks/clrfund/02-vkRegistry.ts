import type { VkRegistry } from '../../../typechain-types'

import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { EContracts, type ISubtaskParams } from '../../helpers/types'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('clrfund:deploy-vk-registry', 'Deploy Vk Registry')
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const vkRegistryContractAddress = storage.getAddress(
      EContracts.VkRegistry,
      hre.network.name
    )

    if (incremental && vkRegistryContractAddress) {
      return
    }

    const vkRegistryContract = await subtask.deployContract<VkRegistry>(
      EContracts.VkRegistry,
      { signer: deployer }
    )

    await storage.register({
      id: EContracts.VkRegistry,
      contract: vkRegistryContract,
      args: [],
      network: hre.network.name,
    })
  })
