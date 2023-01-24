/*
 * Change the user maci key. The maci key is generated using the user's signature and the number of keys generated for the user (the keyNum).
 *
 * Sample command:
 *  yarn hardhat change-key \
 *    --coordinator-x "20086270838376524781985723284144840631515264753353535327805532539360972059317" \
 *    --coordinator-y "1032073044748927333878213383577732023165574647559692910677569193114772857098" \
 *    --factor 0x62cab00605368834c6adf8e6f53da14d6fa9ded1 \
 *    --operator Clr.fund \
 *    --user-index 2 \
 *    --key-num 1 \
 *    --project-indices 1,2 \
 *    --amounts 3,4 \
 *    --network arbitrum-goerli
 *
 * - The coordinator-x and coordinator-y value can be obtained from the factory contract, coordinatorPubKey
 * - The round address can be obtained from the factory contract, getCurrentRound
 * - The operator can be obtained from header of the /round-information page
 * - The user-index can be found in the subgraph entity, PubKey.stateIndex
 * - The key-num is the number of keys generated for this user
 * - The projects are comma separated recipient indices from the subgraph entity, recipients.recipientIndex
 * - The amounts are comma separated list of token amount to be contributed to the recipients
 *
 * This is only used for testing purposes, the UI currently does not have the
 * ability to let user reallocate after changing key using this command
 *
 * Notes:
 * 1) the key change must happen before voting period ends or you will get error E13
 * 2) the number of projects must be at least the same as the previous key or MACI will invalidate the key
 * 3) the sum of amounts must be less than or equal the total contribution or it will be invalid
 *
 */
import { task, types } from 'hardhat/config'
import { createMessage, Keypair, PubKey, Message } from '@clrfund/maci-utils'
import { utils } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'

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
  .addParam('projects', 'Project indices, comma separated')
  .addParam('amounts', 'Contribution to each project, comma separated')
  .addParam(
    'keyNum',
    'The number of keys generated for this user',
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
        projects,
        amounts,
        userIndex,
        keyNum,
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

      const voiceCreditFactor = await currentRound.voiceCreditFactor()
      const nativeTokenAddress = await currentRound.nativeToken()
      const nativeToken = await ethers.getContractAt(
        'ERC20',
        nativeTokenAddress
      )
      const tokenDecimals = await nativeToken.decimals()
      console.log('Token decimal', tokenDecimals.toString())
      console.log('voiceCreditFactor', voiceCreditFactor.toString())

      let nonce = 1
      const oldIndex = Number(keyNum || 1)
      const newIndex = oldIndex + 1
      const userKeypair = Keypair.createFromSignatureHash(hash, oldIndex)
      const newUserKeypair = Keypair.createFromSignatureHash(hash, newIndex)

      console.log('old key', userKeypair.pubKey.asContractParam())
      console.log('new key', newUserKeypair.pubKey.asContractParam())

      const messages: Message[] = []
      const pubKeys: PubKey[] = []
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
      messages.push(message)
      pubKeys.push(encPubKey)

      const projectList = (projects || '').split(',').filter(Boolean)
      const projectAmounts = (amounts || '').split(',').filter(Boolean)

      for (let i = 0; i < projectList.length; i++) {
        const projectAmount = projectAmounts[i]
        if (!projectAmount) {
          break
        }

        nonce++
        const amount = parseUnits(projectAmount, tokenDecimals)
        const voiceCredits = amount.div(voiceCreditFactor)
        const [message, encPubKey] = createMessage(
          userIndex,
          newUserKeypair,
          null,
          coordinatorPubKey,
          projectList[i],
          voiceCredits,
          nonce
        )
        messages.push(message)
        pubKeys.push(encPubKey)
      }

      try {
        const tx = await currentRound.submitMessageBatch(
          messages.reverse().map((x) => x.asContractParam()),
          pubKeys.reverse().map((x) => x.asContractParam())
        )

        console.log('transaction hash', tx.hash)
        const receipt = await tx.wait()
        console.log('transaction status', receipt.status)
      } catch (err) {
        console.error('Error submitting transaction on chain')
        console.error('Make sure you use the correct wallet')
        console.error('Make sure the keyNum is correct')
        console.error('Make sure the round is open')
        console.error(err)
      }
    }
  )
