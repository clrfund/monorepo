import { Contract, BigNumber, ContractReceipt } from 'ethers'
import {
  bnSqrt,
  createMessage,
  getRecipientClaimData,
  IncrementalQuinTree,
  hash5,
  hash3,
  hashLeftRight,
  LEAVES_PER_NODE,
} from '@clrfund/common'

import { genTallyResultCommitment } from '@clrfund/common'
import { VerifyingKey } from 'maci-domainobjs'
import { extractVk } from '@clrfund/maci-circuits'
import { CIRCUITS } from './deployment'
import path from 'path'

export interface ZkFiles {
  processZkFile: string
  processWitness: string
  tallyZkFile: string
  tallyWitness: string
}
/**
 * Get the zkey file path
 * @param name zkey file name
 * @returns zkey file path
 */
export function getCircuitFiles(circuit: string, directory: string): ZkFiles {
  const params = CIRCUITS[circuit]
  return {
    processZkFile: path.join(directory, params.processMessagesZkey),
    processWitness: path.join(directory, params.processWitness),
    tallyZkFile: path.join(directory, params.tallyVotesZkey),
    tallyWitness: path.join(directory, params.tallyWitness),
  }
}

export class MaciParameters {
  stateTreeDepth: number
  intStateTreeDepth: number
  messageTreeSubDepth: number
  messageTreeDepth: number
  voteOptionTreeDepth: number
  maxMessages: number
  maxVoteOptions: number
  messageBatchSize: number
  processVk: VerifyingKey
  tallyVk: VerifyingKey

  constructor(parameters: { [name: string]: any } = {}) {
    this.stateTreeDepth = parameters.stateTreeDepth
    this.intStateTreeDepth = parameters.intStateTreeDepth
    this.messageTreeSubDepth = parameters.messageTreeSubDepth
    this.messageTreeDepth = parameters.messageTreeDepth
    this.voteOptionTreeDepth = parameters.voteOptionTreeDepth
    this.maxMessages = parameters.maxMessages
    this.maxVoteOptions = parameters.maxVoteOptions
    this.messageBatchSize = parameters.messageBatchSize
    this.processVk = parameters.processVk
    this.tallyVk = parameters.tallyVk
  }

  asContractParam(): any[] {
    return [
      this.stateTreeDepth,
      {
        intStateTreeDepth: this.intStateTreeDepth,
        messageTreeSubDepth: this.messageTreeSubDepth,
        messageTreeDepth: this.messageTreeDepth,
        voteOptionTreeDepth: this.voteOptionTreeDepth,
      },
      { maxMessages: this.maxMessages, maxVoteOptions: this.maxVoteOptions },
      this.messageBatchSize,
      this.processVk.asContractParam(),
      this.tallyVk.asContractParam(),
    ]
  }

  static async fromConfig(
    circuit: string,
    directory: string
  ): Promise<MaciParameters> {
    const params = CIRCUITS[circuit]
    const { processZkFile, tallyZkFile } = getCircuitFiles(circuit, directory)
    const processVk: VerifyingKey = VerifyingKey.fromObj(
      await extractVk(processZkFile)
    )
    const tallyVk: VerifyingKey = VerifyingKey.fromObj(
      await extractVk(tallyZkFile)
    )

    return new MaciParameters({
      ...params.maxValues,
      ...params.treeDepths,
      ...params.batchSizes,
      processVk,
      tallyVk,
    })
  }

  static async fromContract(maciFactory: Contract): Promise<MaciParameters> {
    const stateTreeDepth = await maciFactory.stateTreeDepth()
    const {
      intStateTreeDepth,
      messageTreeSubDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
    } = await maciFactory.treeDepths()
    const { maxMessages, maxVoteOptions } = await maciFactory.maxValues()
    const messageBatchSize = await maciFactory.messageBatchSize()
    const vkRegistry = await maciFactory.vkRegistry()

    const processVk = await vkRegistry.getProcessVk(
      stateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      messageBatchSize
    )

    const tallyVk = await vkRegistry.getTallyVk(
      stateTreeDepth,
      intStateTreeDepth,
      voteOptionTreeDepth
    )

    return new MaciParameters({
      stateTreeDepth,
      intStateTreeDepth,
      messageTreeSubDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      maxMessages,
      maxVoteOptions,
      messageBatchSize,
      processVk: VerifyingKey.fromContract(processVk),
      tallyVk: VerifyingKey.fromContract(tallyVk),
    })
  }

  static mock(circuit: string): MaciParameters {
    const processVk = VerifyingKey.fromObj({
      vk_alpha_1: [1, 2],
      vk_beta_2: [
        [1, 2],
        [1, 2],
      ],
      vk_gamma_2: [
        [1, 2],
        [1, 2],
      ],
      vk_delta_2: [
        [1, 2],
        [1, 2],
      ],
      IC: [[1, 2]],
    })
    const params = CIRCUITS[circuit]
    return new MaciParameters({
      ...params.maxValues,
      ...params.treeDepths,
      ...params.batchSizes,
      processVk,
      tallyVk: processVk.copy(),
    })
  }
}

export function getRecipientTallyResult(
  recipientIndex: number,
  recipientTreeDepth: number,
  tally: any
): { recipientIndex: number; result: string; proof: any[] } {
  // Create proof for tally result
  const result = tally.results.tally[recipientIndex]
  const resultTree = new IncrementalQuinTree(
    recipientTreeDepth,
    BigInt(0),
    LEAVES_PER_NODE,
    hash5
  )
  for (const leaf of tally.results.tally) {
    resultTree.insert(leaf)
  }
  const resultProof = resultTree.genMerklePath(recipientIndex)
  return {
    recipientIndex,
    result,
    proof: resultProof.pathElements.map((x) => x.map((y) => y.toString())),
  }
}

export function getRecipientTallyResultsBatch(
  recipientStartIndex: number,
  recipientTreeDepth: number,
  tally: any,
  batchSize: number
): any[] {
  const tallyCount = tally.results.tally.length
  if (recipientStartIndex >= tallyCount) {
    throw new Error('Recipient index out of bound')
  }

  const tallyData = []
  const lastIndex =
    recipientStartIndex + batchSize > tallyCount
      ? tallyCount
      : recipientStartIndex + batchSize
  for (let i = recipientStartIndex; i < lastIndex; i++) {
    tallyData.push(getRecipientTallyResult(i, recipientTreeDepth, tally))
  }

  return [
    tallyData.map((item) => item.recipientIndex),
    tallyData.map((item) => item.result),
    tallyData.map((item) => item.proof),
  ]
}

export async function addTallyResultsBatch(
  fundingRound: Contract,
  recipientTreeDepth: number,
  tallyData: any,
  batchSize: number,
  startIndex = 0,
  callback?: (processed: number, receipt: ContractReceipt) => void
): Promise<BigNumber> {
  let totalGasUsed = BigNumber.from(0)
  const { tally } = tallyData.results

  const spentVoiceCreditsHash = hashLeftRight(
    BigInt(tallyData.totalSpentVoiceCredits.spent),
    BigInt(tallyData.totalSpentVoiceCredits.salt)
  )

  const perVOSpentVoiceCreditsHash = genTallyResultCommitment(
    tallyData.perVOSpentVoiceCredits.tally.map((x: string) => BigInt(x)),
    BigInt(tallyData.perVOSpentVoiceCredits.salt),
    recipientTreeDepth
  )

  const newResultCommitment = genTallyResultCommitment(
    tally.map((x: string) => BigInt(x)),
    BigInt(tallyData.results.salt),
    recipientTreeDepth
  )

  const newTallyCommitment = hash3([
    newResultCommitment,
    spentVoiceCreditsHash,
    perVOSpentVoiceCreditsHash,
  ])

  if ('0x' + newTallyCommitment.toString(16) !== tallyData.newTallyCommitment) {
    console.error(
      'Error: the newTallyCommitment is invalid.',
      '0x' + newTallyCommitment.toString(16),
      tallyData.newTallyCommitment
    )
  }

  for (let i = startIndex; i < tally.length; i = i + batchSize) {
    const data = getRecipientTallyResultsBatch(
      i,
      recipientTreeDepth,
      tallyData,
      batchSize
    )

    const tx = await fundingRound.addTallyResultsBatch(
      recipientTreeDepth,
      ...data,
      BigInt(tallyData.results.salt).toString(),
      spentVoiceCreditsHash.toString(),
      BigInt(perVOSpentVoiceCreditsHash).toString(),
      tallyData.newTallyCommitment
    )
    const receipt = await tx.wait()
    if (callback) {
      // the 2nd element in the data array has the array of
      // recipients to be processed for the batch
      const totalProcessed = i + data[1].length
      callback(totalProcessed, receipt)
    }
    totalGasUsed = totalGasUsed.add(receipt.gasUsed)
  }
  return totalGasUsed
}

export { createMessage, getRecipientClaimData, bnSqrt }
