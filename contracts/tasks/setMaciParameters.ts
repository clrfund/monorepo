/**
 * Set the zkeys parameters in MACI factory
 * Sample usage:
 *
 * yarn hardhat set-maci-parameters \
 *  --circuit <circuit type> \
 *  --maci-factory <maci factory> \
 *  --network <network>
 *
 * See utils/circuits.ts for the circuit type value
 */

import { task } from 'hardhat/config'
import { DEFAULT_CIRCUIT } from '../utils/circuits'
import { MaciParameters } from '../utils/maciParameters'

task('set-maci-parameters', 'Set the token in ClrFund')
  .addParam('maciFactory', 'The MACIFactory contract address')
  .addParam('circuit', 'The circuit type', DEFAULT_CIRCUIT)
  .addParam('directory', 'The zkeys directory')
  .setAction(async ({ maciFactory, circuit, directory }, { ethers }) => {
    const factory = await ethers.getContractAt('MACIFactory', maciFactory)

    const maciParameters = await MaciParameters.fromConfig(circuit, directory)
    const setMaciTx = await factory.setMaciParameters(
      ...maciParameters.asContractParam()
    )
    console.log('Set MACI parameters at ', setMaciTx.hash)
    await setMaciTx.wait()

    const newParameters = await MaciParameters.fromContract(factory)
    console.log(newParameters)
  })
