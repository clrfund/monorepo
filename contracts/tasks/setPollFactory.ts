/**
 * Set the Poll factory in the MACI factory
 * Usage:
 * hardhat set-poll-factory \
 *   --maci-factory <maci factory address> \
 *   [--poll-factory <poll factory address>] \
 *   --network <network>
 */
import { task } from 'hardhat/config'
import { deployPollFactory } from '../utils/deployment'

task(
  'set-poll-factory',
  'Set (create if non-existent) the Poll factory address in the MACI factory'
)
  .addParam('maciFactory', 'The MACI factory contract address')
  .addOptionalParam('pollFactory', 'The poll factory contract address')
  .setAction(async ({ maciFactory, pollFactory }, { ethers, config }) => {
    const maciFactoryContract = await ethers.getContractAt(
      'MACIFactory',
      maciFactory
    )

    let pollFactoryAddress = pollFactory
    if (!pollFactoryAddress) {
      const [signer] = await ethers.getSigners()
      const pollFactoryContract = await deployPollFactory({
        signer,
        ethers,
        artifactsPath: config.paths.artifacts,
      })
      pollFactoryAddress = await pollFactoryContract.getAddress()
    }

    const tx = await maciFactoryContract.setPollFactory(pollFactoryAddress)
    await tx.wait()

    console.log('Set poll factory at tx', tx.hash)
  })
