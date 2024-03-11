/**
 * Deploy a brightid user registry
 */

import { Subtask } from '../../helpers/Subtask'
import { ISubtaskParams } from '../../helpers/types'
import { EContracts } from '../../../utils/types'

const subtask = Subtask.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask(
    'round:deploy-brightid-user-registry',
    'Deploy a BrightId user registry for a new round'
  )
  .setAction(async (params: ISubtaskParams, hre) => {
    subtask.setHre(hre)

    const userRegistryName = subtask.getConfigField<string>(
      EContracts.ClrFund,
      'userRegistry'
    )

    if (userRegistryName !== EContracts.BrightIdUserRegistry) {
      // only create a new BrightID user registry for each new round
      return
    }

    const shouldDeploy = subtask.getConfigField<boolean>(
      EContracts.BrightIdUserRegistry,
      'deploy'
    )

    if (!shouldDeploy) {
      // for testing, we don't deploy for every round
      return
    }

    const steps = await subtask.getDeploySteps(['user'], params)
    await subtask.runSteps(steps, 0)
  })
