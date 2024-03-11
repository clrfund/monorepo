/**
 * Deploy an instance of the BrightID sponsor contract
 *
 */
import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { ISubtaskParams } from '../../helpers/types'
import { EContracts } from '../../../utils/types'
import { ClrFund } from '../../../typechain-types'
import { getAddress } from 'ethers'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Register task and step
 */
subtask
  .addTask('token:set-token', 'Set token in the ClrFund contract')
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const network = hre.network.name

    let tokenAddress = subtask.getConfigField<string>(
      EContracts.ClrFund,
      'token'
    )
    if (!tokenAddress) {
      tokenAddress = storage.mustGetAddress(
        EContracts.AnyOldERC20Token,
        network
      )
    }

    const clrfundContract = await subtask.getContract<ClrFund>({
      name: EContracts.ClrFund,
    })

    if (incremental) {
      const currentTokenAddress = await clrfundContract.nativeToken()
      if (getAddress(currentTokenAddress) === getAddress(tokenAddress)) {
        // already set to this token
        return
      }
    }

    const tx = await clrfundContract.setToken(tokenAddress)
    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Failed to set token')
    }
  })
