import type { VkRegistry } from '../../../typechain-types'

import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { setVerifyingKeys } from '../../../utils/contracts'
import { MaciParameters } from '../../../utils/maciParameters'
import { EContracts, type ISubtaskParams } from '../../helpers/types'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('clrfund:deploy-vk-registry', 'Deploy Vk Registry and set keys')
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

    const circuit = subtask.getConfigField<string>(
      EContracts.VkRegistry,
      'circuit',
      true
    )
    const directory = subtask.getConfigField<string>(
      EContracts.VkRegistry,
      'paramsDirectory',
      true
    )

    const maciParameters = await MaciParameters.fromConfig(circuit, directory)
    await setVerifyingKeys(vkRegistryContract, maciParameters)

    await storage.register({
      id: EContracts.VkRegistry,
      contract: vkRegistryContract,
      args: [],
      network: hre.network.name,
    })
  })
