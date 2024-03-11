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
  .addTask('clrfund:deploy-poseidon', 'Deploy poseidon contracts')
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const poseidonT3ContractAddress = storage.getAddress(
      EContracts.PoseidonT3,
      hre.network.name
    )
    const poseidonT4ContractAddress = storage.getAddress(
      EContracts.PoseidonT4,
      hre.network.name
    )
    const poseidonT5ContractAddress = storage.getAddress(
      EContracts.PoseidonT5,
      hre.network.name
    )
    const poseidonT6ContractAddress = storage.getAddress(
      EContracts.PoseidonT6,
      hre.network.name
    )

    if (
      incremental &&
      poseidonT3ContractAddress &&
      poseidonT4ContractAddress &&
      poseidonT5ContractAddress &&
      poseidonT6ContractAddress
    ) {
      return
    }

    const PoseidonT3Contract = await subtask.deployContract(
      EContracts.PoseidonT3,
      { signer: deployer }
    )
    const PoseidonT4Contract = await subtask.deployContract(
      EContracts.PoseidonT4,
      { signer: deployer }
    )
    const PoseidonT5Contract = await subtask.deployContract(
      EContracts.PoseidonT5,
      { signer: deployer }
    )
    const PoseidonT6Contract = await subtask.deployContract(
      EContracts.PoseidonT6,
      { signer: deployer }
    )

    await Promise.all([
      storage.register({
        id: EContracts.PoseidonT3,
        contract: PoseidonT3Contract,
        args: [],
        network: hre.network.name,
      }),
      storage.register({
        id: EContracts.PoseidonT4,
        contract: PoseidonT4Contract,
        args: [],
        network: hre.network.name,
      }),
      storage.register({
        id: EContracts.PoseidonT5,
        contract: PoseidonT5Contract,
        args: [],
        network: hre.network.name,
      }),
      storage.register({
        id: EContracts.PoseidonT6,
        contract: PoseidonT6Contract,
        args: [],
        network: hre.network.name,
      }),
    ])
  })
