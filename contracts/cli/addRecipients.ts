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

  for (let i = 6; i < 10; i++) {
    const recipient = recipients[i]
    const addRecipientTx = await recipientRegistry.addRecipient(
      recipient.address,
      JSON.stringify({
        name: `recipient ${i}`,
        description: `recipient ${i}`,
      })
    )
    addRecipientTx.wait()
  }

  console.log('Added test recipients')
}

main(program.args)
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(-1)
  })
