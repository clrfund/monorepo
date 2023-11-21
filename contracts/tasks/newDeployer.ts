/**
 * Create a new instance of the ClrFundDeployer
 *
 * Sample usage:
 *
 *  yarn hardhat new-deployer --network <network>
 *
 */

import { task } from 'hardhat/config'
import {
  deployContract,
  deployPoseidonLibraries,
  deployMaciFactory,
} from '../utils/deployment'
import { DEFAULT_CIRCUIT } from '../utils/circuits'
import { JSONFile } from '../utils/JSONFile'

task('new-deployer', 'Create the ClrFund deployer and its dependent contracts')
  .addParam('circuit', 'The circuit type', DEFAULT_CIRCUIT)
  .addParam('directory', 'The zkeys directory')
  .addParam('stateFile', 'The file to save the deployer contract address')
  .setAction(
    async ({ circuit, directory, stateFile }, { ethers, config, run }) => {
      const [signer] = await ethers.getSigners()
      console.log(`Deploying from address: ${signer.address}`)

      const libraries = await deployPoseidonLibraries({
        artifactsPath: config.paths.artifacts,
        signer,
        ethers,
      })
      console.log('Deployed Poseidons', libraries)

      const maciFactory = await deployMaciFactory({ libraries, ethers })
      console.log('Deployed MaciFactory at', maciFactory.address)

      await run('set-maci-parameters', {
        maciFactory: maciFactory.address,
        circuit,
        directory,
      })

      const clrfundTemplate = await deployContract({
        name: 'ClrFund',
        ethers,
      })
      console.log('Deployed clrfundTemplate at', clrfundTemplate.address)

      const fundingRoundFactory = await deployContract({
        name: 'FundingRoundFactory',
        libraries,
        ethers,
      })
      console.log(
        'Deployed FundingRoundFactory at',
        fundingRoundFactory.address
      )

      const clrfundDeployer = await deployContract({
        name: 'ClrFundDeployer',
        ethers,
        contractArgs: [
          clrfundTemplate.address,
          maciFactory.address,
          fundingRoundFactory.address,
        ],
      })
      console.log('Deployed ClrfundDeployer at', clrfundDeployer.address)

      if (stateFile) {
        JSONFile.update(stateFile, { deployer: clrfundDeployer.address })
      }
    }
  )
