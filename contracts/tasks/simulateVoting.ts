/**
 * This script is used to simulate mass voting for testing purposes.
 *
 * sameple usage:
 * yarn hardhat simulate-voting --fee 0.003 \
 *   --coordinator-pub-key <Coordinator's MACI serialized public key> \
 *   --total 20 \
 *   --factory <funding round factory contract address> \
 *   --contributors 30 \
 *   --recipients 2 \
 *   --network arbitrum-goerli
 */
import { task, types } from 'hardhat/config'
import { createMessage, PubKey, Keypair } from '@clrfund/maci-utils'
import { HDNode } from 'ethers/lib/utils'
import { getEventArg } from '../utils/contracts'

function getRandomRecipient(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

task('simulate-voting', 'Simulate voting for the current round')
  .addParam(
    'factory',
    'The funding round factory contract address',
    undefined,
    types.string
  )
  .addParam(
    'contributors',
    'The number of contributors to simulate',
    5,
    types.int
  )
  .addParam('recipients', 'The number of recipients to simulate', 2, types.int)
  .addParam(
    'total',
    'The total amount of tokens to run this test with',
    undefined,
    types.string
  )
  .addParam(
    'fee',
    'The amount to fund the contributor wallets to pay for transaction fee'
  )
  .addParam('coordinatorPubKey', 'The MACI public key of the coordinator')
  .setAction(
    async (
      { factory, recipients, contributors, total, fee, coordinatorPubKey },
      { ethers }
    ) => {
      const mnemonic = process.env.WALLET_MNEMONIC || ''
      const [coordinator] = await ethers.getSigners()
      console.log('coordinator', coordinator.address)

      const pubKey = PubKey.unserialize(coordinatorPubKey)

      const factoryContract = await ethers.getContractAt(
        'FundingRoundFactory',
        factory
      )
      const roundAddress = await factoryContract.getCurrentRound()
      console.log('Current funding round', roundAddress)

      const fundingRound = await ethers.getContractAt(
        'FundingRound',
        roundAddress,
        coordinator
      )
      const maciAddress = await fundingRound.maci()
      const maciContract = await ethers.getContractAt('MACI', maciAddress)
      const tokenAddress = await fundingRound.nativeToken()
      const token = await ethers.getContractAt(
        'ERC20',
        tokenAddress,
        coordinator
      )
      const userRegistryAddress = await fundingRound.userRegistry()
      const userRegistry = await ethers.getContractAt(
        'SimpleUserRegistry',
        userRegistryAddress
      )

      const decimals = await token.decimals()
      const totalAmountInUnits = ethers.utils.parseUnits(total, decimals)
      const contributionAmount = totalAmountInUnits.div(contributors)
      const feeInUnits = ethers.utils.parseUnits(fee)
      const hdnode = HDNode.fromMnemonic(mnemonic)
      console.log('contribution amount', contributionAmount.toString())

      for (let i = 1; i <= contributors; i += 1) {
        const contributorHdNode = hdnode.derivePath(
          ethers.utils.getAccountPath(i)
        )
        const contributor = new ethers.Wallet(
          contributorHdNode.privateKey,
          ethers.provider
        )

        // register user if not registered
        const isVerifiedUser = await userRegistry.isVerifiedUser(
          contributor.address
        )
        if (!isVerifiedUser) {
          const addUserTx = await userRegistry.addUser(contributor.address)
          await addUserTx.wait()
        }
        console.log('Contributor', i, contributor.address)

        // fund wallet
        const contributorBalance = await ethers.provider.getBalance(
          contributor.address
        )
        console.log('Account balance', contributorBalance.toString())
        if (contributorBalance.lt(feeInUnits)) {
          console.log('funding wallet', feeInUnits.toString())
          const fundTx = await coordinator.sendTransaction({
            to: contributor.address,
            value: feeInUnits,
          })
          await fundTx.wait()
        }

        // transfer usdc
        const tokenBalance = await token.balanceOf(contributor.address)
        console.log('Token balance', tokenBalance.toString())
        if (tokenBalance.lt(contributionAmount)) {
          const transferTx = await token.transfer(
            contributor.address,
            contributionAmount
          )
          await transferTx.wait()
          console.log('transfered token')
        }

        // contribute
        const allowance = await token.allowance(
          contributor.address,
          fundingRound.address
        )
        console.log('Token allowance', allowance.toString())

        if (allowance.lt(contributionAmount)) {
          const tokenAsContributor = token.connect(contributor)
          console.log('Approving token..')
          const approveTx = await tokenAsContributor.approve(
            fundingRound.address,
            contributionAmount
          )
          await approveTx.wait()
          console.log('Approved token to funding rond')
        }

        const contributorStatus = await fundingRound.contributors(
          contributor.address
        )

        console.log(
          'Previously contributed voice credits',
          contributorStatus.voiceCredits.toString()
        )

        if (contributorStatus.voiceCredits.gt(0)) {
          console.log(`${contributor.address} already contributed`)
          continue
        }
        const contributorKeypair = new Keypair()
        console.log(
          'Contributor privake key',
          contributorKeypair.privKey.serialize()
        )
        const fundingRoundAsContributor = fundingRound.connect(contributor)
        const contributionTx = await fundingRoundAsContributor.contribute(
          contributorKeypair.pubKey.asContractParam(),
          contributionAmount
        )
        await contributionTx.wait(5)
        const stateIndex = await getEventArg(
          contributionTx,
          maciContract,
          'SignUp',
          '_stateIndex'
        )
        const voiceCredits = await getEventArg(
          contributionTx,
          maciContract,
          'SignUp',
          '_voiceCreditBalance'
        )
        console.log('stateIndex', stateIndex.toString())
        console.log('voiceCredits', voiceCredits.toString())

        // get random project between 1 and recipient count
        const recipientIndex = getRandomRecipient(1, recipients)
        console.log('Recipient index', recipientIndex)

        // create message
        const nonce = 1
        const [message, encPubKey] = createMessage(
          stateIndex,
          contributorKeypair,
          null,
          pubKey,
          recipientIndex,
          voiceCredits,
          nonce
        )

        // vote
        console.log('sending votes')
        const voteTx = await fundingRoundAsContributor.submitMessageBatch(
          [message.asContractParam()],
          [encPubKey.asContractParam()]
        )
        await voteTx.wait()
        console.log(
          i,
          `${contributor.address} voted with ${contributionAmount} credits`
        )
        console.log('')
      }
    }
  )
