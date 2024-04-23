import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { EContracts, ISubtaskParams } from '../../helpers/types'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('clrfund:deploy-tally-factory', 'Deploy tally factory')
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const tallyFactoryContractAddress = storage.getAddress(
      EContracts.TallyFactory,
      hre.network.name
    )

    if (incremental && tallyFactoryContractAddress) {
      return
    }

    const libraries = storage.mustGetPoseidonLibraries(hre.network.name)
    const tallyFactoryContract = await subtask.deployContract(
      EContracts.TallyFactory,
      {
        libraries,
        signer: deployer,
      }
    )

    await storage.register({
      id: EContracts.TallyFactory,
      contract: tallyFactoryContract,
      args: [],
      network: hre.network.name,
    })
  })
