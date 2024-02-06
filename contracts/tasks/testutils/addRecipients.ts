/**
 * Add recipients for testing purposes
 *
 * Sample usage:
 *
 *  yarn hardat test-add-recipients --clrfund <ClrFund address> --network <network>
 *
 */
import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'

const bannerImageHash = 'QmPAZJkV2TH2hmudpSwj8buxwiG1ckNa2ZbrPFop3Td5oD'
const thumbnailImageHash = 'QmPAZJkV2TH2hmudpSwj8buxwiG1ckNa2ZbrPFop3Td5oD'

task('test-add-recipients', 'Add test recipients')
  .addParam('clrfund', 'The ClrFund contract address')
  .setAction(async ({ clrfund }, { ethers }) => {
    const [signer, ...recipients] = await ethers.getSigners()
    console.log('Add recipients by', signer.address)

    const clrfundContract = await ethers.getContractAt(
      EContracts.ClrFund,
      clrfund,
      signer
    )
    const recipientRegistryAddress = await clrfundContract.recipientRegistry()
    console.log('Recipient registry', recipientRegistryAddress)

    const recipientRegistry = await ethers.getContractAt(
      EContracts.SimpleRecipientRegistry,
      recipientRegistryAddress,
      signer
    )

    let numAdded = 0
    for (let i = 1; i < 10; i++) {
      const recipient = recipients[i]
      const recipientAddress = recipient?.address || signer.address
      const addRecipientTx = await recipientRegistry.addRecipient(
        recipientAddress,
        JSON.stringify({
          name: `recipient ${i}`,
          description: `recipient ${i}`,
          bannerImageHash,
          thumbnailImageHash,
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
  })
