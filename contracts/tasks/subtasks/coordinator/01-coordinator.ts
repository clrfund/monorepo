/**
 * Deploy an instance of the BrightID sponsor contract
 *
 */
import { Subtask } from '../../helpers/Subtask'
import { EContracts } from '../../../utils/types'
import { setCoordinator } from '../../../utils/deployment'
import { Contract, getAddress } from 'ethers'
import { Keypair, PrivKey, PubKey } from '@clrfund/common'

const subtask = Subtask.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('coordinator:set-coordinator', 'Set the clrfund coordinator')
  .setAction(async (_, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const clrfundContract = await subtask.getContract<Contract>({
      name: EContracts.ClrFund,
    })

    const coordinator = await subtask.getConfigField<string>(
      EContracts.ClrFund,
      'coordinaotor'
    )
    const coordinatorAddress = coordinator || (await deployer.getAddress())

    if (!process.env.COORDINATOR_MACISK) {
      throw new Error('Please set environment variable COORDINATOR_MACISK')
    }
    const coordinatorMacisk = process.env.COORDINATOR_MACISK

    const [currentCoordinator, coordinatorPubKey] = await Promise.all([
      clrfundContract.coordinator(),
      clrfundContract.coordinatorPubKey(),
    ])

    const currentPubKey = new PubKey([coordinatorPubKey.x, coordinatorPubKey.y])
    const newPrivKey = PrivKey.deserialize(coordinatorMacisk)
    const newKeypair = new Keypair(newPrivKey)

    const normalizedCurrentCoordinator = getAddress(currentCoordinator)
    const normalizedNewCoordinator = getAddress(coordinatorAddress)
    console.log('Current coordinator', normalizedCurrentCoordinator)
    console.log('    New coordinator', normalizedNewCoordinator)

    const serializedCurrentPubKey = currentPubKey.serialize()
    const serializedNewPubKey = newKeypair.pubKey.serialize()
    console.log('Current MACI key', serializedCurrentPubKey)
    console.log('    New MACI key', serializedNewPubKey)
    console.log()

    if (
      normalizedCurrentCoordinator === normalizedNewCoordinator &&
      serializedCurrentPubKey === serializedNewPubKey
    ) {
      console.log('Coordinator address and MACI key already set, skipping...')
      return
    }

    const tx = await setCoordinator({
      clrfundContract,
      coordinatorAddress: normalizedNewCoordinator,
      coordinatorMacisk,
    })

    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Failed to set coordinator')
    }

    subtask.logTransaction(tx)
  })
