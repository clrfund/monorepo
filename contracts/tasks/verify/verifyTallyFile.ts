/**
 * Verify the tally file
 *
 * Sample usage:
 * yarn hardhat verify-tally-file \
 *   --tally-file <tally.json> \
 *   --tally-address <tally contract address> \
 *   --network <network>
 */
import { task } from 'hardhat/config'
import { Signer } from 'ethers'
import { verify } from '../../utils/maci'
import { JSONFile } from '../../utils/JSONFile'

type Args = {
  tallyAddress: string
  tallyFile: string
  signer: Signer
}

async function main({ tallyAddress, tallyFile, signer }: Args) {
  const tallyData = JSONFile.read(tallyFile)
  const pollId = tallyData.pollId
  const maciAddress = tallyData.maci

  await verify({
    subsidyEnabled: false,
    tallyFile,
    pollId: BigInt(pollId),
    maciAddress,
    tallyAddress,
    signer,
    quiet: false,
  })
}

task('verify-tally-file', 'Verify the tally file')
  .addParam('tallyFile', 'The tally file')
  .addParam('tallyAddress', 'The tally contract address')
  .setAction(async ({ tallyFile, tallyAddress }, { ethers }) => {
    const [signer] = await ethers.getSigners()
    await main({ tallyFile, tallyAddress, signer })
  })
