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
 * Deploy step registration and task itself
 */
subtask
  .addTask(
    'recipient:set-recipient-registry',
    'Set recipient registry in the ClrFund contract'
  )
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const network = hre.network.name

    const recipientRegistryName = subtask.getConfigField<string>(
      EContracts.ClrFund,
      'recipientRegistry'
    )

    const recipientRegistryContractAddress = storage.mustGetAddress(
      recipientRegistryName as EContracts,
      network
    )

    const clrfundContract = await subtask.getContract<ClrFund>({
      name: EContracts.ClrFund,
    })

    if (incremental) {
      const currentRecipientRegistryAddress =
        await clrfundContract.recipientRegistry()

      if (
        getAddress(currentRecipientRegistryAddress) ===
        getAddress(recipientRegistryContractAddress)
      ) {
        // already set
        return
      }
    }

    const tx = await clrfundContract.setRecipientRegistry(
      recipientRegistryContractAddress
    )
    const receipt = await tx.wait()

    if (receipt?.status !== 1) {
      throw new Error(
        `Failed to set recipient registry ${recipientRegistryContractAddress}`
      )
    }
  })
