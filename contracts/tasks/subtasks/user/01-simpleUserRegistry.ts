/**
 * Deploy a simple user registry
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
  .addTask('user:deploy-simple-user-registry', 'Deploy a simple user registry')
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const userRegistryName = subtask.getConfigField<string>(
      EContracts.ClrFund,
      'userRegistry'
    )

    if (userRegistryName !== EContracts.SimpleUserRegistry) {
      return
    }

    const simpleUserRegistryContractAddress = storage.getAddress(
      EContracts.SimpleUserRegistry,
      hre.network.name
    )

    if (incremental && simpleUserRegistryContractAddress) {
      return
    }

    const args = []
    const simpleUserRegistryContract = await subtask.deployContract(
      EContracts.SimpleUserRegistry,
      { signer: deployer, args }
    )

    await storage.register({
      id: EContracts.SimpleUserRegistry,
      contract: simpleUserRegistryContract,
      args,
      network: hre.network.name,
    })
  })
