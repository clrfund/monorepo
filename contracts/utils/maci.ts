import { Contract, BigNumber, ContractReceipt } from 'ethers'
import {
  bnSqrt,
  createMessage,
  getRecipientClaimData,
  IncrementalQuinTree,
  hash5,
  LEAVES_PER_NODE,
} from '@clrfund/maci-utils'

export class MaciParameters {
  stateTreeDepth = 32
  messageTreeDepth = 32
  voteOptionTreeDepth = 3
  tallyBatchSize = 8
  messageBatchSize = 8
  batchUstVerifier!: string
  qvtVerifier!: string
  signUpDuration = 7 * 86400
  votingDuration = 7 * 86400

  constructor(parameters: { [name: string]: any } = {}) {
    this.update(parameters)
  }

  update(parameters: { [name: string]: any }) {
    for (const [name, value] of Object.entries(parameters)) {
      ;(this as any)[name] = value
    }
  }

  values(): any[] {
    // To be passed to setMaciParameters()
    return [
      this.stateTreeDepth,
      this.messageTreeDepth,
      this.voteOptionTreeDepth,
      this.tallyBatchSize,
      this.messageBatchSize,
      this.batchUstVerifier,
      this.qvtVerifier,
      this.signUpDuration,
      this.votingDuration,
    ]
  }

  static async read(maciFactory: Contract): Promise<MaciParameters> {
    const { stateTreeDepth, messageTreeDepth, voteOptionTreeDepth } =
      await maciFactory.treeDepths()
    const { tallyBatchSize, messageBatchSize } = await maciFactory.batchSizes()
    const batchUstVerifier = await maciFactory.batchUstVerifier()
    const qvtVerifier = await maciFactory.qvtVerifier()
    const signUpDuration = (await maciFactory.signUpDuration()).toNumber()
    const votingDuration = (await maciFactory.votingDuration()).toNumber()
    return new MaciParameters({
      stateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      tallyBatchSize,
      messageBatchSize,
      batchUstVerifier,
      qvtVerifier,
      signUpDuration,
      votingDuration,
    })
  }
}

export function getRecipientTallyResult(
  recipientIndex: number,
  recipientTreeDepth: number,
  tally: any
): any[] {
  // Create proof for tally result
  const result = tally.results.tally[recipientIndex]
  const resultSalt = tally.results.salt
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

  return [
    recipientTreeDepth,
    recipientIndex,
    result,
    resultProof.pathElements.map((x) => x.map((y) => y.toString())),
    resultSalt,
  ]
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

  // the salt is the same for all tally results
  const resultSalt = tallyData[0][4]
  return [
    recipientTreeDepth,
    tallyData.map((item) => item[1]),
    tallyData.map((item) => item[2]),
    tallyData.map((item) => item[3]),
    resultSalt,
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
  for (let i = startIndex; i < tally.length; i = i + batchSize) {
    const data = getRecipientTallyResultsBatch(
      i,
      recipientTreeDepth,
      tallyData,
      batchSize
    )

    const tx = await fundingRound.addTallyResultsBatch(...data)
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
