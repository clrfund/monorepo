/**
 * Add recipients for testing purposes
 *
 * Sample usage:
 *
 *  HARDHAT_NETWORK=localhost yarn ts-node clr/addRecipients.ts <ClrFund address>
 *
 */
import { program } from 'commander'
import { ethers } from 'hardhat'

program
  .description('Add test recipients')
  .argument('clrfund', 'The ClrFund contract address')
  .parse()

async function main(args: any) {
  const [signer, ...recipients] = await ethers.getSigners()
  console.log('Add recipients by', signer.address)

  const clrfundContract = await ethers.getContractAt('ClrFund', args[0], signer)
  const recipientRegistryAddress = await clrfundContract.recipientRegistry()
  console.log('Recipient registry', recipientRegistryAddress)

  const recipientRegistry = await ethers.getContractAt(
    'SimpleRecipientRegistry',
    recipientRegistryAddress,
    signer
  )

  let numAdded = 0
  for (let i = 6; i < 10; i++) {
    const recipient = recipients[i]
    const recipientAddress = recipient?.address || signer.address
    const addRecipientTx = await recipientRegistry.addRecipient(
      recipientAddress,
      JSON.stringify({
        name: `recipient ${i}`,
        description: `recipient ${i}`,
        bannerImageHash: 'QmPAZJkV2TH2hmudpSwj8buxwiG1ckNa2ZbrPFop3Td5oD',
        thumbnailImageHash: 'QmPAZJkV2TH2hmudpSwj8buxwiG1ckNa2ZbrPFop3Td5oD',
      })
    )
    const receipt = await addRecipientTx.wait()
    if (receipt.status === 1) {
      numAdded++
    } else {
      console.log('Failed to add recipient', i)
    }
  }

  console.log(`Added ${numAdded} test recipients`)
}

main(program.args)
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(-1)
  })
