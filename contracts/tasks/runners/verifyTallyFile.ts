/**
 * Verify the content of a tally file
 *
 * Usage:
 * hardhat verify-tally-file --tally-file <tally file path> --network <network>
 */
import { task } from 'hardhat/config'
import { JSONFile } from '../../utils/JSONFile'
import { verify } from '../../utils/maci'
import { ContractStorage } from '../helpers/ContractStorage'
import { EContracts } from '../helpers/types'

const storage = ContractStorage.getInstance()

task('verify-tally-file', 'Verify the content of a tally file')
  .addParam('tallyFile', 'The tally file path')
  .addOptionalParam('tallyAddress', 'The tally contract address')
  .addFlag('quiet', 'Whether to log on the console')
  .setAction(async ({ quiet, tallyFile, tallyAddress }, hre) => {
    const [signer] = await hre.ethers.getSigners()
    const tallyData = JSONFile.read(tallyFile)

    // get the tally contract address from contract storage because the tally file is missing it
    const tallyContractAddress =
      tallyAddress ??
      (await storage.mustGetAddress(EContracts.Tally, hre.network.name))

    await verify({
      pollId: tallyData.pollId,
      subsidyEnabled: false,
      tallyData,
      maciAddress: tallyData.maci,
      tallyAddress: tallyContractAddress,
      signer,
      quiet,
    })
  })
