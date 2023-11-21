/**
 * Add recipients for testing purposes
 *
 * Sample usage:
 *
 *  yarn hardhat add-recipients --network <network> --clrfund <ClrFund address>
 *
 */

import { task } from 'hardhat/config'

task('add-recipients', 'Add test recipients')
  .addParam('clrfund', 'The ClrFund contract address')
  .setAction(async ({ clrfund }, { ethers }) => {
    const [signer, ...recipients] = await ethers.getSigners()
    console.log('Add recipients by', signer.address)

    const clrfundContract = await ethers.getContractAt(
      'ClrFund',
      clrfund,
      signer
    )
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
  })
