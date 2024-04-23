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
    'clrfund:deploy-funding-round-factory',
    'Deploy funding round factory'
  )
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const fundingRoundFactoryContractAddress = storage.getAddress(
      EContracts.FundingRoundFactory,
      hre.network.name
    )

    if (incremental && fundingRoundFactoryContractAddress) {
      return
    }

    const fundingRoundFactoryContract = await subtask.deployContract(
      EContracts.FundingRoundFactory,
      { signer: deployer }
    )

    await storage.register({
      id: EContracts.FundingRoundFactory,
      contract: fundingRoundFactoryContract,
      args: [],
      network: hre.network.name,
    })
  })
