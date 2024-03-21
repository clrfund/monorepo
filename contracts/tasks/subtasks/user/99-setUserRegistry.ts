/**
 * Deploy a new recipient registry
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
  .addTask(
    'user:set-user-registry',
    'Set user registry in the ClrFund contract'
  )
  .setAction(async ({ incremental, clrfund }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const network = hre.network.name

    const userRegistryName = subtask.getConfigField<string>(
      EContracts.ClrFund,
      'userRegistry'
    )

    const userRegistryContractAddress = storage.mustGetAddress(
      userRegistryName as EContracts,
      network
    )

    const clrfundContract = await subtask.getContract<ClrFund>({
      name: EContracts.ClrFund,
      address: clrfund,
    })

    if (incremental) {
      const currentUserRegistryAddress = await clrfundContract.userRegistry()

      if (
        getAddress(currentUserRegistryAddress) ===
        getAddress(userRegistryContractAddress)
      ) {
        // already set
        return
      }
    }

    const tx = await clrfundContract.setUserRegistry(
      userRegistryContractAddress
    )
    const receipt = await tx.wait()

    if (receipt?.status !== 1) {
      throw new Error(
        `Failed to se user registry ${userRegistryContractAddress}`
      )
    }

    subtask.logTransaction(tx)
  })
