/**
 * Create a new instance of the ClrFundDeployer contract
 */
import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { ISubtaskParams } from '../../helpers/types'
import { EContracts } from '../../../utils/types'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

subtask
  .addTask(
    'deployer:deploy-clrfund-deployer',
    'Deploy ClrFundDeployer contract'
  )
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()
    const network = hre.network.name

    const clrfundDeployerContractAddress = storage.getAddress(
      EContracts.ClrFundDeployer,
      network
    )

    if (incremental && clrfundDeployerContractAddress) {
      return
    }

    const clrfundContractAddress = storage.mustGetAddress(
      EContracts.ClrFund,
      network
    )

    const maciFactoryContractAddress = storage.mustGetAddress(
      EContracts.MACIFactory,
      network
    )

    const fundingRoundFactoryContractAddress = storage.mustGetAddress(
      EContracts.FundingRoundFactory,
      network
    )

    const args = [
      clrfundContractAddress,
      maciFactoryContractAddress,
      fundingRoundFactoryContractAddress,
    ]

    const ClrfundDeployerContract = await subtask.deployContract(
      EContracts.ClrFundDeployer,
      { signer: deployer, args }
    )

    await storage.register({
      id: EContracts.ClrFundDeployer,
      contract: ClrfundDeployerContract,
      args,
      network: hre.network.name,
    })
  })
