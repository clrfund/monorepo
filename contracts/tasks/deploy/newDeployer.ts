/**
 * Create a new instance of the ClrFundDeployer
 *
 * Sample usage:
 *
 * yarn hardhat new-deployer --directory ~/params --network <network>
 *
 */
import {
  deployContract,
  deployPoseidonLibraries,
  deployMaciFactory,
} from '../../utils/deployment'
import { DEFAULT_CIRCUIT } from '../../utils/circuits'
import { JSONFile } from '../../utils/JSONFile'
import { MaciParameters } from '../../utils/maciParameters'
import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'

task('new-deployer', 'Deploy a new ClrFund deployer')
  .addParam('directory', 'The circuit directory')
  .addOptionalParam('circuit', 'The circuit type', DEFAULT_CIRCUIT)
  .addOptionalParam(
    'stateFile',
    'File to store the ClrFundDeployer address for e2e testing'
  )
  .setAction(
    async ({ circuit, stateFile, directory }, { ethers, network, config }) => {
      const [signer] = await ethers.getSigners()
      console.log('Circuit: ', circuit)
      console.log('Network: ', network.name)
      console.log(`Deploying from address: ${signer.address}`)

      const libraries = await deployPoseidonLibraries({
        artifactsPath: config.paths.artifacts,
        signer,
        ethers,
      })
      console.log('Deployed Poseidons', libraries)

      const maciParameters = await MaciParameters.fromConfig(circuit, directory)
      const maciFactory = await deployMaciFactory({
        libraries,
        ethers,
        maciParameters,
      })
      console.log('Deployed MaciFactory at', maciFactory.target)

      const clrfundTemplate = await deployContract({
        name: EContracts.ClrFund,
        ethers,
      })
      console.log('Deployed ClrFund Template at', clrfundTemplate.target)

      const fundingRoundFactory = await deployContract({
        name: EContracts.FundingRoundFactory,
        ethers,
      })
      console.log('Deployed FundingRoundFactory at', fundingRoundFactory.target)

      const clrfundDeployer = await deployContract({
        name: EContracts.ClrFundDeployer,
        ethers,
        contractArgs: [
          clrfundTemplate.target,
          maciFactory.target,
          fundingRoundFactory.target,
        ],
      })
      console.log('Deployed ClrfundDeployer at', clrfundDeployer.target)

      if (stateFile) {
        const clrfundDeployerAddress = await clrfundDeployer.getAddress()
        JSONFile.update(stateFile, { deployer: clrfundDeployerAddress })
      }
    }
  )
