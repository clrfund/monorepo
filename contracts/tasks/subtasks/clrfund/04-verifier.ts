import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { EContracts, ISubtaskParams } from '../../helpers/types'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('clrfund:deploy-verifier', 'Deploy verifier')
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const verifierContractAddress = storage.getAddress(
      EContracts.Verifier,
      hre.network.name
    )

    if (incremental && verifierContractAddress) {
      return
    }

    const verifierContract = await subtask.deployContract(EContracts.Verifier, {
      signer: deployer,
    })

    await storage.register({
      id: EContracts.Verifier,
      contract: verifierContract,
      args: [],
      network: hre.network.name,
    })
  })
