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

    const template = subtask.getConfigField<boolean>(
      EContracts.ClrFund,
      'template'
    )
    const maciFactoryAddress = storage.mustGetAddress(
      EContracts.MACIFactory,
      hre.network.name
    )
    const fundingRoundFactoryContractAddress = storage.mustGetAddress(
      EContracts.FundingRoundFactory,
      hre.network.name
    )

    const clrfundContract = await subtask.deployContract<ClrFund>(
      EContracts.ClrFund,
      { signer: deployer }
    )

    if (!template) {
      const tx = await clrfundContract.init(
        maciFactoryAddress,
        fundingRoundFactoryContractAddress
      )
      const receipt = await tx.wait()
      if (receipt?.status !== 1) {
        throw new Error('Failed to initialize ClrFund')
      }
    }

    await storage.register({
      id: EContracts.ClrFund,
      contract: clrfundContract,
      args: [],
      network: hre.network.name,
    })
  })
