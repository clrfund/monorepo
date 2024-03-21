/**
 * Deploy an instance of the BrightID sponsor contract
 *
 */
import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { EContracts } from '../../../utils/types'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('user:deploy-brightid-sponsor', 'Deploy BrightID sponsor contract')
  .setAction(async (_, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const userRegistryName = subtask.getConfigField<string>(
      EContracts.ClrFund,
      'userRegistry'
    )

    if (userRegistryName !== EContracts.BrightIdUserRegistry) {
      return
    }

    let brightidSponsorContractAddress = subtask.tryGetConfigField<string>(
      EContracts.BrightIdUserRegistry,
      'sponsor'
    )

    if (brightidSponsorContractAddress) {
      console.log(
        `Skip BrightIdSponsor deployment, use ${brightidSponsorContractAddress}`
      )
      return
    }

    brightidSponsorContractAddress = storage.getAddress(
      EContracts.BrightIdSponsor,
      hre.network.name
    )

    if (brightidSponsorContractAddress) {
      return
    }

    const BrightIdSponsorContract = await subtask.deployContract(
      EContracts.BrightIdSponsor,
      { signer: deployer }
    )

    await storage.register({
      id: EContracts.BrightIdSponsor,
      contract: BrightIdSponsorContract,
      args: [],
      network: hre.network.name,
    })
  })
