import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { ISubtaskParams } from '../../helpers/types'
import { EContracts } from '../../../utils/types'
import { Signer } from 'ethers'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy a Poseidon contract
 * @param poseidonName Poseidon contract name
 * @param network Deployment network
 * @param signer Signer of the transaction
 * @param incremental Whether to check for previous deployment
 */
async function deployPoseidon(
  poseidonName: EContracts,
  network: string,
  signer: Signer,
  incremental?: boolean
) {
  const poseidonAddress = storage.getAddress(poseidonName, network)

  if (incremental && poseidonAddress) {
    return
  }

  const PoseidonContract = await subtask.deployContract(poseidonName, {
    signer,
  })

  await storage.register({
    id: poseidonName,
    contract: PoseidonContract,
    args: [],
    network,
  })
}

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('clrfund:deploy-poseidon', 'Deploy poseidon contracts')
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()
    const network = hre.network.name

    await deployPoseidon(EContracts.PoseidonT3, network, deployer, incremental)
    await deployPoseidon(EContracts.PoseidonT4, network, deployer, incremental)
    await deployPoseidon(EContracts.PoseidonT5, network, deployer, incremental)
    await deployPoseidon(EContracts.PoseidonT6, network, deployer, incremental)
  })
