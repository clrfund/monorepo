/**
 * Create a new instance of the ClrFund contract.
 * If the coordinator ETH address is not provided, use the signer address
 * If the coordinator MACI secret key is not provided, create a random one
 *
 * Sample usage:
 *
 *  yarn hardhat new-clrfund --network <network> \
 *    --deployer <clrfund deployer contract address> \
 *    --token <native token address> \
 *    [--coordinator <coordinator ETH address> ] \
 *    [--coordinator-macisk <coordinator MACI serialized secret key> ] \
 *    [--user-type <user registry type> ] \
 *    [--recipient-type <recipient registry type> ]
 *
 *
 * If user registry address and recipient registry address are not provided,
 * the registry types become mandatory as well as the other parameters needed
 * to deploy the registries
 *
 * If token is not provided, a new ERC20 token will be created
 */

import { task } from 'hardhat/config'
import { getEventArg } from '../utils/contracts'
import { challengePeriodSeconds } from '../utils/deployment'
import { JSONFile } from '../utils/JSONFile'

task('new-clrfund', 'Deploy a new ClrFund instance')
  .addParam('deployer', 'ClrFund deployer contract address')
  .addOptionalParam('token', 'The token address')
  .addOptionalParam('coordinator', 'The coordinator ETH address')
  .addOptionalParam(
    'coordinatorMacisk',
    'The coordinator MACI serialized secret key'
  )
  .addOptionalParam(
    'userType',
    'The user registry type, e.g brightid, simple, merkle, snapshot'
  )
  .addOptionalParam('userRegistry', 'The user registry contract address')
  .addOptionalParam('context', 'The BrightId context')
  .addOptionalParam('verifier', 'The BrightId verifier address')
  .addOptionalParam('sponsor', 'The BrightId sponsor contract address')
  .addOptionalParam('recipientType', 'The recipient registry type')
  .addOptionalParam('recipientRegistry', 'The recipient registry address')
  .addOptionalParam(
    'deposit',
    'The deposit for optimistic recipient registry',
    '0.01'
  )
  .addOptionalParam(
    'challengePeriod',
    'The challenge period for optimistic recipient registry',
    challengePeriodSeconds
  )
  .addOptionalParam('stateFile', 'The state file to save the clrfund address')
  .setAction(
    async (
      {
        deployer,
        token,
        coordinator,
        coordinatorMacisk,
        userType,
        userRegistry,
        context,
        verifier,
        sponsor,
        recipientType,
        recipientRegistry,
        deposit,
        challengePeriod,
        stateFile,
      },
      { run, ethers }
    ) => {
      const [signer] = await ethers.getSigners()
      console.log(`Deploying from address: ${signer.address}`)

      const clrfundDeployer = await ethers.getContractAt(
        'ClrFundDeployer',
        deployer
      )
      console.log('ClrFundDeployer:', clrfundDeployer.address)

      const tx = await clrfundDeployer.deployClrFund()
      const receipt = await tx.wait()

      let clrfund: string
      try {
        clrfund = await getEventArg(
          tx,
          clrfundDeployer,
          'NewInstance',
          'clrfund'
        )
        console.log('ClrFund: ', clrfund)
      } catch (e) {
        console.log('receipt', receipt)
        throw new Error(
          'Unable to get clrfund address after deployment. ' +
            (e as Error).message
        )
      }

      // set coordinator, use the coordinator address if available,
      // otherwise use the signer address
      // If the maci secret key is not provided, it will create a new key
      const coordinatorAddress = coordinator ?? signer.address
      await run('set-coordinator', {
        clrfund,
        coordinator: coordinatorAddress,
        coordinatorMacisk,
        stateFile,
      })

      // set token
      await run('set-token', { clrfund, token })

      // set user registry
      await run('set-user-registry', {
        clrfund,
        type: userType,
        registry: userRegistry,
        context,
        verifier,
        sponsor,
      })

      // set recipient registry
      await run('set-recipient-registry', {
        clrfund,
        type: recipientType,
        registry: recipientRegistry,
        deposit,
        challengePeriod,
      })

      if (stateFile) {
        JSONFile.update(stateFile, { clrfund })
      }
    }
  )
