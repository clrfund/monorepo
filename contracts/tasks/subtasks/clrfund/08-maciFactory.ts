import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { EContracts, ISubtaskParams } from '../../helpers/types'
import { ZERO_ADDRESS } from '../../../utils/constants'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('clrfund:deploy-maci-factory', 'Deploy maci factory')
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const maciFactoryContractAddress = storage.getAddress(
      EContracts.MACIFactory,
      hre.network.name
    )

    if (incremental && maciFactoryContractAddress) {
      return
    }

    const verifierContractAddress = storage.mustGetAddress(
      EContracts.Verifier,
      hre.network.name
    )
    const vkRegistryContractAddress = storage.mustGetAddress(
      EContracts.VkRegistry,
      hre.network.name
    )
    const pollFactoryContractAddress = storage.mustGetAddress(
      EContracts.PollFactory,
      hre.network.name
    )
    const tallyFactoryContractAddress = storage.mustGetAddress(
      EContracts.TallyFactory,
      hre.network.name
    )
    const messageProcessorFactoryContractAddress = storage.mustGetAddress(
      EContracts.MessageProcessorFactory,
      hre.network.name
    )
    // all the factories to deploy MACI contracts
    const factories = {
      pollFactory: pollFactoryContractAddress,
      tallyFactory: tallyFactoryContractAddress,
      // subsidy is not currently used
      subsidyFactory: ZERO_ADDRESS,
      messageProcessorFactory: messageProcessorFactoryContractAddress,
    }

    const args = [vkRegistryContractAddress, factories, verifierContractAddress]
    const libraries = storage.mustGetPoseidonLibraries(hre.network.name)

    const maciFactoryContract = await subtask.deployContract(
      EContracts.MACIFactory,
      {
        args,
        signer: deployer,
        libraries,
      }
    )

    await storage.register({
      id: EContracts.MACIFactory,
      contract: maciFactoryContract,
      args,
      network: hre.network.name,
    })
  })
