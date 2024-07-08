/**
 * Export the project logo images in a ClrFund round.
 *
 * Sample usage:
 * yarn hardhat export-images \
 *   --output-dir ../vue-apps/public/ipfs
 *   --gateway https://ipfs.io
 *   --round-file ../vue-app/src/rounds/arbitrum/0x4A2d90844EB9C815eF10dB0371726F0ceb2848B0.json
 *
 * Notes:
 * 1) This script assumes the round has been exported using the `export-round` hardhat task
 */

import { task } from 'hardhat/config'
import { isPathExist, makeDirectory } from '../../utils/misc'
import { getIpfsContent } from '@clrfund/common'
import fs from 'fs'

/**
 * Download the IPFS file with the ipfsHash to the output directory
 * @param gateway IPFS gateway url
 * @param ipfsHash IPFS hash of the file to download
 * @param outputDir The directory to store the downloaded file
 */
async function download({
  gateway,
  ipfsHash,
  outputDir,
}: {
  gateway: string
  ipfsHash: string
  outputDir: string
}) {
  if (!ipfsHash) return

  const res = await getIpfsContent(ipfsHash, gateway)
  if (res.hasBody()) {
    console.log('Downloaded', ipfsHash)
    fs.writeFileSync(`${outputDir}/${ipfsHash}`, res.body)
  }
}

task('export-images', 'Export project logo images')
  .addParam('outputDir', 'The output directory')
  .addParam('roundFile', 'The exported funding round file path')
  .addParam('gateway', 'The IPFS gateway url')
  .setAction(async ({ outputDir, roundFile, gateway }) => {
    console.log('Starting to download from ipfs')

    if (!isPathExist(outputDir)) {
      makeDirectory(outputDir)
    }

    const data = fs.readFileSync(roundFile, { encoding: 'utf-8' })
    const round = JSON.parse(data)
    const projects = round.projects
    const images = projects.map((project: any) => {
      const { bannerImageHash, thumbnailImageHash, imageHash } =
        project.metadata
      return { bannerImageHash, thumbnailImageHash, imageHash }
    })

    for (let i = 0; i < images.length; i++) {
      await download({
        gateway,
        ipfsHash: images[i].bannerImageHash,
        outputDir,
      })
      await download({
        gateway,
        ipfsHash: images[i].thumbnailImageHash,
        outputDir,
      })
      await download({
        gateway,
        ipfsHash: images[i].imageHash,
        outputDir,
      })
    }
  })
