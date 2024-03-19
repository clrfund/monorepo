import { VkRegistry } from '../../../typechain-types'
import { setVerifyingKeys } from '../../../utils/contracts'
import { MaciParameters } from '../../../utils/maciParameters'
import { Subtask } from '../../helpers/Subtask'
import { EContracts, ISubtaskParams } from '../../helpers/types'

const subtask = Subtask.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('clrfund:set-vkRegistry', 'Set verifying keys in VkRegistry')
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const vkRegistryContract = await subtask.getContract<VkRegistry>({
      name: EContracts.VkRegistry,
      signer: deployer,
    })

    const circuit = subtask.getConfigField<string>(
      EContracts.VkRegistry,
      'circuit'
    )
    const directory = subtask.getConfigField<string>(
      EContracts.VkRegistry,
      'paramsDirectory'
    )

    const maciParameters = await MaciParameters.fromConfig(circuit, directory)
    const messageBatchSize = maciParameters.getMessageBatchSize()
    const stateTreeDepth = maciParameters.stateTreeDepth
    const voteOptionTreeDepth = maciParameters.treeDepths.voteOptionTreeDepth
    const messageTreeDepth = maciParameters.treeDepths.messageTreeDepth
    const intStateTreeDepth = maciParameters.treeDepths.intStateTreeDepth
    const hasProcessVk = await vkRegistryContract.hasProcessVk(
      stateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize
    )

    const hasTallyVk = await vkRegistryContract.hasTallyVk(
      stateTreeDepth,
      intStateTreeDepth,
      voteOptionTreeDepth
    )

    if (incremental) {
      if (hasProcessVk && hasTallyVk) {
        console.log('VkRegistry has already been set, skipping...')
        return
      }
    }

    if (hasProcessVk) {
      throw new Error('Error: process verification key has already been set')
    }

    if (hasTallyVk) {
      throw new Error('Error: tally verification key has already been set')
    }

    const tx = await setVerifyingKeys(vkRegistryContract, maciParameters)
    subtask.logTransaction(tx)
  })
