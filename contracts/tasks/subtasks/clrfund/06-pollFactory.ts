import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { EContracts, ISubtaskParams } from '../../helpers/types'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('clrfund:deploy-poll-factory', 'Deploy poll factory')
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const pollFactoryContractAddress = storage.getAddress(
      EContracts.PollFactory,
      hre.network.name
    )

    if (incremental && pollFactoryContractAddress) {
      return
    }

    const libraries = storage.mustGetPoseidonLibraries(hre.network.name)
    const pollFactoryContract = await subtask.deployContract(
      EContracts.PollFactory,
      {
        signer: deployer,
        libraries,
      }
    )

    await storage.register({
      id: EContracts.PollFactory,
      contract: pollFactoryContract,
      args: [],
      network: hre.network.name,
    })
  })
