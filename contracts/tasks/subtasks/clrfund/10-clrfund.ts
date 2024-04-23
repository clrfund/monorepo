import { ClrFund } from '../../../typechain-types'
import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { EContracts, ISubtaskParams } from '../../helpers/types'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('clrfund:deploy-clrfund', 'Deploy ClrFund')
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const clrfundContractAddress = storage.getAddress(
      EContracts.ClrFund,
      hre.network.name
    )

    if (incremental && clrfundContractAddress) {
      return
    }

    const clrfundContract = await subtask.deployContract<ClrFund>(
      EContracts.ClrFund,
      { signer: deployer }
    )

    await storage.register({
      id: EContracts.ClrFund,
      contract: clrfundContract,
      args: [],
      network: hre.network.name,
    })
  })
