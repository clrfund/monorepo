import { Contract, BigNumber, ContractReceipt } from 'ethers'
import { genRandomSalt, IncrementalQuinTree } from 'maci-crypto'
import { Keypair, PubKey, Command, Message } from 'maci-domainobjs'

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

export function bnSqrt(a: BigNumber): BigNumber {
  // Take square root from a big number
  // https://stackoverflow.com/a/52468569/1868395
  if (a.isZero()) {
    return a
  }
  let x
  let x1 = a.div(2)
  do {
    x = x1
    x1 = x.add(a.div(x)).div(2)
  } while (!x.eq(x1))
  return x
}

export function createMessage(
  userStateIndex: number,
  userKeypair: Keypair,
  newUserKeypair: Keypair | null,
  coordinatorPubKey: PubKey,
  voteOptionIndex: number | null,
  voiceCredits: BigNumber | null,
  nonce: number,
  salt?: BigInt
): [Message, PubKey] {
  const encKeypair = new Keypair()
  if (!salt) {
    salt = genRandomSalt()
  }
  const quadraticVoteWeight = voiceCredits ? bnSqrt(voiceCredits) : 0
  const command = new Command(
    BigInt(userStateIndex),
    newUserKeypair ? newUserKeypair.pubKey : userKeypair.pubKey,
    BigInt(voteOptionIndex || 0),
    BigInt(quadraticVoteWeight),
    BigInt(nonce),
    BigInt(salt)
  )
  const signature = command.sign(userKeypair.privKey)
  const message = command.encrypt(
    signature,
    Keypair.genEcdhSharedKey(encKeypair.privKey, coordinatorPubKey)
  )
  return [message, encKeypair.pubKey]
}

export function getRecipientTallyResult(
  recipientIndex: number,
  recipientTreeDepth: number,
  tally: any
): any[] {
  // Create proof for tally result
  const result = tally.results.tally[recipientIndex]
  const resultSalt = tally.results.salt
  const resultTree = new IncrementalQuinTree(recipientTreeDepth, BigInt(0))
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

export function getRecipientClaimData(
  recipientIndex: number,
  recipientTreeDepth: number,
  tally: any
): any[] {
  // Create proof for total amount of spent voice credits
  const spent = tally.totalVoiceCreditsPerVoteOption.tally[recipientIndex]
  const spentSalt = tally.totalVoiceCreditsPerVoteOption.salt
  const spentTree = new IncrementalQuinTree(recipientTreeDepth, BigInt(0))
  for (const leaf of tally.totalVoiceCreditsPerVoteOption.tally) {
    spentTree.insert(leaf)
  }
  const spentProof = spentTree.genMerklePath(recipientIndex)

  return [
    recipientIndex,
    spent,
    spentProof.pathElements.map((x) => x.map((y) => y.toString())),
    spentSalt,
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
      const totalProccessed = i + data[1].length
      callback(totalProccessed, receipt)
    }
    totalGasUsed = totalGasUsed.add(receipt.gasUsed)
  }
  return totalGasUsed
}
