/**
 * Deploy an instance of the BrightID sponsor contract
 *
 */
import { Subtask } from '../../helpers/Subtask'
import { EContracts } from '../../../utils/types'
import { Contract, getNumber } from 'ethers'
import { MaciParameters } from '../../../utils/maciParameters'

const subtask = Subtask.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('maci:set-maci-params', 'Set the MACI parameters')
  .setAction(async (_, hre) => {
    subtask.setHre(hre)

    const circuit = subtask.getConfigField<string>(
      EContracts.VkRegistry,
      'circuit'
    )
    const directory = subtask.getConfigField<string>(
      EContracts.VkRegistry,
      'paramsDirectory'
    )
    const maciParameters = await MaciParameters.fromConfig(circuit, directory)

    const maciFactoryContract = await subtask.getContract<Contract>({
      name: EContracts.MACIFactory,
    })

    const stateTreeDepth = await maciFactoryContract.stateTreeDepth()
    const treeDepths = await maciFactoryContract.treeDepths()

    const {
      intStateTreeDepth,
      messageTreeSubDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
    } = maciParameters.treeDepths

    if (
      getNumber(stateTreeDepth) === maciParameters.stateTreeDepth &&
      getNumber(treeDepths.intStateTreeDepth) === intStateTreeDepth &&
      getNumber(treeDepths.messageTreeSubDepth) === messageTreeSubDepth &&
      getNumber(treeDepths.messageTreeDepth) === messageTreeDepth &&
      getNumber(treeDepths.voteOptionTreeDepth) === voteOptionTreeDepth
    ) {
      // MACI parameters already set
      console.log('Skip - parameters already set')
      return
    }

    const tx = await maciFactoryContract.setMaciParameters(
      ...maciParameters.asContractParam()
    )
    await tx.wait()

    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Failed to set MACI parameters')
    }

    subtask.logTransaction(tx)
  })
