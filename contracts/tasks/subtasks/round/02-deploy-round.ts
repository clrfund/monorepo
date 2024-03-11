/**
 * Deploy a funding round
 */

import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { EContracts } from '../../../utils/types'
import {
  ClrFund,
  FundingRound,
  MACI,
  Poll,
  Tally,
} from '../../../typechain-types'
import { ContractTransactionResponse } from 'ethers'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Register MACI contract in the contract storage for verification
 *
 * @param fundingRoundContract The funding round contract
 * @param network The network
 * @param tx The funding round deployment transaction
 */
async function registerMaci(
  fundingRoundContract: FundingRound,
  network: string,
  tx: ContractTransactionResponse
) {
  const maciContractAddress = await fundingRoundContract.maci()
  const maciContract = await subtask.getContract<MACI>({
    name: EContracts.MACI,
    address: maciContractAddress,
  })

  const args = await Promise.all([
    maciContract.pollFactory(),
    maciContract.messageProcessorFactory(),
    maciContract.tallyFactory(),
    maciContract.subsidyFactory(),
    maciContract.signUpGatekeeper(),
    maciContract.initialVoiceCreditProxy(),
    maciContract.topupCredit(),
    maciContract.stateTreeDepth(),
  ])

  await storage.register({
    id: EContracts.MACI,
    contract: maciContract,
    network,
    args,
    tx,
  })
}

/**
 * Register the Poll contract in the contract storage
 *
 * @param duration The round duration
 * @param fundingRoundContract The funding round contract
 * @param network The network
 * @param tx The funding round deployment transaction

 */
async function registerPoll(
  duration: number,
  fundingRoundContract: FundingRound,
  network: string,
  tx: ContractTransactionResponse
) {
  const pollContractAddress = await fundingRoundContract.poll()
  const pollContract = await subtask.getContract<Poll>({
    name: EContracts.Poll,
    address: pollContractAddress,
  })

  const [maxValues, treeDepths, coordinatorPubKey, extContracts] =
    await Promise.all([
      pollContract.maxValues(),
      pollContract.treeDepths(),
      pollContract.coordinatorPubKey(),
      pollContract.extContracts(),
    ])

  const args = [
    [
      duration,
      {
        maxMessages: maxValues.maxMessages,
        maxVoteOptions: maxValues.maxVoteOptions,
      },
      {
        intStateTreeDepth: treeDepths.intStateTreeDepth,
        messageTreeSubDepth: treeDepths.messageTreeSubDepth,
        messageTreeDepth: treeDepths.messageTreeDepth,
        voteOptionTreeDepth: treeDepths.voteOptionTreeDepth,
      },
      {
        x: coordinatorPubKey.x,
        y: coordinatorPubKey.y,
      },
      {
        maci: extContracts.maci,
        messageAq: extContracts.messageAq,
        topupCredit: extContracts.topupCredit,
      },
    ],
  ]

  await storage.register({
    id: EContracts.Poll,
    contract: pollContract,
    network,
    args,
    tx,
  })
}

/**
 * Register the Tally and the MessageProcessor contracts on the contract storage
 *
 * @param fundingRoundContract The funding round contract
 * @param network The network
 * @param tx The funding round deployment transaction

 */
async function registerTallyAndMessageProcessor(
  fundingRoundContract: FundingRound,
  network: string,
  tx: ContractTransactionResponse
) {
  const [tally, poll] = await Promise.all([
    fundingRoundContract.tally(),
    fundingRoundContract.poll(),
  ])

  const tallyContract = await subtask.getContract<Tally>({
    name: EContracts.Tally,
    address: tally,
  })

  const mp = await tallyContract.messageProcessor()
  const messageProcessorContract = await subtask.getContract({
    name: EContracts.MessageProcessor,
    address: mp,
  })

  const [verifier, vkRegistry] = await Promise.all([
    tallyContract.verifier(),
    tallyContract.vkRegistry(),
  ])

  let args = [verifier, vkRegistry, poll, mp]
  await storage.register({
    id: EContracts.Tally,
    contract: tallyContract,
    network,
    args,
    tx,
  })

  args = [verifier, vkRegistry, poll]
  await storage.register({
    id: EContracts.MessageProcessor,
    contract: messageProcessorContract,
    network,
    args,
    tx,
  })
}

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('round:deploy-round', 'Deploy a funding round')
  .setAction(async (_, hre) => {
    subtask.setHre(hre)
    const network = hre.network.name

    const duration = subtask.getConfigField<number>(
      EContracts.FundingRound,
      'duration'
    )

    const clrfundContract = await subtask.getContract<ClrFund>({
      name: EContracts.ClrFund,
    })

    const tx = await clrfundContract.deployNewRound(duration)
    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Failed to deploy funding round')
    }
    subtask.logTransaction(tx)

    const fundingRoundContractAddress = await clrfundContract.getCurrentRound()

    const fundingRoundContract = await subtask.getContract<FundingRound>({
      name: EContracts.FundingRound,
      address: fundingRoundContractAddress,
    })

    await storage.register({
      id: EContracts.FundingRound,
      contract: fundingRoundContract,
      args: [duration],
      network,
      tx,
    })

    await registerMaci(fundingRoundContract, network, tx)
    await registerPoll(duration, fundingRoundContract, network, tx)
    await registerTallyAndMessageProcessor(fundingRoundContract, network, tx)
  })
