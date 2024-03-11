import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { EContracts, ISubtaskParams } from '../../helpers/types'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask(
    'clrfund:deploy-message-processor-factory',
    'Deploy message processor factory'
  )
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const messageProcessorFactoryContractAddress = storage.getAddress(
      EContracts.MessageProcessorFactory,
      hre.network.name
    )

    if (incremental && messageProcessorFactoryContractAddress) {
      return
    }

    const libraries = await storage.mustGetPoseidonLibraries(hre.network.name)
    const messageProcessorFactoryContract = await subtask.deployContract(
      EContracts.MessageProcessorFactory,
      {
        signer: deployer,
        libraries,
      }
    )

    await storage.register({
      id: EContracts.MessageProcessorFactory,
      contract: messageProcessorFactoryContract,
      args: [],
      network: hre.network.name,
    })
  })
