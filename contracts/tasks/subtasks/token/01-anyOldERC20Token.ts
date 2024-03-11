/**
 * Deploy an instance of the BrightID sponsor contract
 *
 */
import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { ISubtaskParams } from '../../helpers/types'
import { EContracts } from '../../../utils/types'
import { isAddress } from 'ethers'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('token:deploy-erc20-token', 'Deploy an ERC20 contract')
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const token = subtask.getConfigField<boolean>(EContracts.ClrFund, 'token')
    if (isAddress(token)) {
      // using an existing token, no need to deploy
      return
    }

    const initialSupply = subtask.getConfigField<string>(
      EContracts.AnyOldERC20Token,
      'initialSupply'
    )

    const anyOldERC20TokenContractAddress = storage.getAddress(
      EContracts.AnyOldERC20Token,
      hre.network.name
    )

    if (incremental && anyOldERC20TokenContractAddress) {
      return
    }

    const args = [initialSupply]
    const anyOldERC20TokenContract = await subtask.deployContract(
      EContracts.AnyOldERC20Token,
      { signer: deployer, args }
    )

    await storage.register({
      id: EContracts.AnyOldERC20Token,
      contract: anyOldERC20TokenContract,
      args,
      network: hre.network.name,
    })
  })
