/**
 * Deploy a new recipient registry
 */
import { encodeBytes32String } from 'ethers'
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
    'user:deploy-brightid-user-registry',
    'Deploy a brightid user registry'
  )
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()
    const network = hre.network.name

    const userRegistryName = subtask.getConfigField<string>(
      EContracts.ClrFund,
      'userRegistry'
    )

    if (userRegistryName !== EContracts.BrightIdUserRegistry) {
      return
    }

    const brightidUserRegistryContractAddress = storage.getAddress(
      EContracts.BrightIdUserRegistry,
      network
    )

    if (incremental && brightidUserRegistryContractAddress) {
      return
    }

    const shouldDeploy = subtask.tryGetConfigField<boolean>(
      EContracts.BrightIdUserRegistry,
      'deploy'
    )
    if (shouldDeploy === false) {
      return
    }

    const context = subtask.getConfigField<string>(
      EContracts.BrightIdUserRegistry,
      'context'
    )
    const verifier = subtask.getConfigField<string>(
      EContracts.BrightIdUserRegistry,
      'verifier'
    )

    let sponsor = subtask.tryGetConfigField<string>(
      EContracts.BrightIdUserRegistry,
      'sponsor'
    )
    if (!sponsor) {
      sponsor = storage.mustGetAddress(EContracts.BrightIdSponsor, network)
    }

    const args = [encodeBytes32String(context), verifier, sponsor]
    const brightidUserRegistryContract = await subtask.deployContract(
      EContracts.BrightIdUserRegistry,
      { signer: deployer, args }
    )

    await storage.register({
      id: EContracts.BrightIdUserRegistry,
      contract: brightidUserRegistryContract,
      args,
      network,
    })
  })
