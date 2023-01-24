/*
 * Change the user maci key.
 * The original key is generated using the user's env variable WALLET_PRIVATE_KEY_1 signature
 * The new key is generated using WALLET_PRIVATE_KEY_2 signature
 *
 * sample command:
 *  yarn hardhat change-key --coordinator-y "9999" --coordinator-x "999" --round-address 0xc52a22f3c6bc630a38ae1402d1363821b0c8aa6f --operator Clr.fund --user-index 2 --old-key-index 1 --new-key-index 2 --network arbitrum-goerli
 *
 * - The coordinator X and Y value can be obtained from the factory contract, coordinatorPubKey
 * - The round address can be obtained from the factory contract, getCurrentRound
 * - The operator can be obtained from header of the /round-information page
 *
 * This is only used for testing purposes, the UI currently does not have the
 * ability to let user reallocate after changing key using this command
 *
 * Note: the key change must happen before voting period ends or you will get error E13
 *
 */
import { task, types } from 'hardhat/config'
import { createMessage, Keypair, PubKey } from '@clrfund/maci-utils'
import { utils } from 'ethers'

type LoginMessageArgs = {
  contractAddress: string
  operator: string
  chainId: number
}

function getLoginMessage({
  contractAddress,
  operator,
  chainId,
}: LoginMessageArgs): string {
  return `Welcome to ${operator}!

To get logged in, sign this message to prove you have access to this wallet. This does not cost any ether.

You will be asked to sign each time you load the app.

Contract address: ${contractAddress.toLowerCase()}.

Chain ID: ${chainId}`
}

task('change-key', 'Change the MACI key')
  .addParam('factory', 'The funding round factory contract address')
  .addParam('coordinatorX', 'The coordinator MACI public key X value')
  .addParam('coordinatorY', 'The coordinator MACI public key Y value')
  .addParam(
    'oldKeyIndex',
    'The index of the old MACI key, based 1',
    undefined,
    types.int
  )
  .addParam(
    'newKeyIndex',
    'The index of the new MACI key, based 1',
    undefined,
    types.int
  )
  .addParam('userIndex', 'The user index')
  .addParam('operator', 'The funding round operator for the login message')
  .setAction(
    async (
      {
        factory,
        coordinatorX,
        coordinatorY,
        userIndex,
        oldKeyIndex,
        newKeyIndex,
        operator,
      },
      { ethers }
    ) => {
      const [signer] = await ethers.getSigners()
      console.log('Signer address', signer.address)

      const factoryContract = await ethers.getContractAt(
        'FundingRoundFactory',
        factory
      )

      const roundAddress = await factoryContract.getCurrentRound()
      const currentRound = await ethers.getContractAt(
        'FundingRound',
        roundAddress
      )

      const { chainId } = await ethers.provider.getNetwork()
      console.log('chainId', chainId)

      const loginMessage = getLoginMessage({
        operator,
        contractAddress: roundAddress,
        chainId,
      })

      console.log('loginMessage', loginMessage)
      const signature = await signer.signMessage(loginMessage)

      console.log('signature', signature)
      const hash = utils.sha256(signature)
      console.log('hash', hash)

      const nonce = 1
      const oldIndex = Number(oldKeyIndex)
      const newIndex = Number(newKeyIndex)
      const userKeypair = Keypair.createFromSignatureHash(hash, oldIndex)
      const newUserKeypair = Keypair.createFromSignatureHash(hash, newIndex)

      console.log('old key', userKeypair.pubKey.asContractParam())
      console.log('new key', newUserKeypair.pubKey.asContractParam())

      const coordinatorPubKey = new PubKey([
        BigInt(coordinatorX),
        BigInt(coordinatorY),
      ])
      const [message, encPubKey] = createMessage(
        userIndex,
        userKeypair,
        newUserKeypair,
        coordinatorPubKey,
        null,
        null,
        nonce
      )

      try {
        const tx = await currentRound.submitMessageBatch(
          [message.asContractParam()],
          [encPubKey.asContractParam()]
        )

        console.log('transaction hash', tx.hash)
        const receipt = await tx.wait()
        console.log('transaction status', receipt.status)
      } catch (err) {
        console.error(
          'Error submitting transaction on chain, make sure that you use the wallet associated with the MACI key'
        )
        console.error(err)
      }
    }
  )
