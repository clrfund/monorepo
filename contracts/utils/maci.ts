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
  genTallyResultCommitment,
  Keypair,
} from '@clrfund/common'
import * as os from 'os'
import {
  mergeMessages,
  mergeSignups,
  genProofs,
  proveOnChain,
} from '@clrfund/maci-cli'

import { getTalyFilePath, isPathExist } from './misc'
import { CIRCUITS } from './circuits'
import path from 'path'

interface TallyResult {
  recipientIndex: number
  result: string
  proof: any[]
}

export interface ZkFiles {
  processZkFile: string
  processWitness: string
  processWasm: string
  tallyZkFile: string
  tallyWitness: string
  tallyWasm: string
}

export const isOsArm = os.arch().includes('arm')

export function getRecipientTallyResult(
  recipientIndex: number,
  recipientTreeDepth: number,
  tally: any
): TallyResult {
  // Create proof for tally result
  const result = tally.results.tally[recipientIndex]
  if (result == null) {
    // result is null or undefined
    throw Error(`Missing tally result for index ${recipientIndex}`)
  }

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
    proof: resultProof.pathElements.map((x: bigint[]) =>
      x.map((y) => y.toString())
    ),
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

  const tallyData: TallyResult[] = []
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
      BigInt(perVOSpentVoiceCreditsHash).toString()
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
    processWasm: path.join(directory, params.processWasm),
    tallyZkFile: path.join(directory, params.tallyVotesZkey),
    tallyWitness: path.join(directory, params.tallyWitness),
    tallyWasm: path.join(directory, params.tallyWasm),
  }
}

/* Input to getGenProofArgs() */
type getGenProofArgsInput = {
  maciAddress: string
  providerUrl: string
  pollId: string
  // coordinator's MACI serialized secret key
  coordinatorMacisk: string
  // the transaction hash of the creation of the MACI contract
  maciTxHash?: string
  // the key get zkeys file mapping, see utils/circuits.ts
  circuitType: string
  circuitDirectory: string
  rapidSnark?: string
  // where the proof will be produced
  outputDir: string
}

type getGenProofArgsResult = {
  contract: string
  eth_provider: string
  poll_id: string
  tally_file: string
  rapidsnark?: string
  process_witnessgen?: string
  tally_witnessgen?: string
  process_wasm?: string
  tally_wasm?: string
  process_zkey: string
  tally_zkey: string
  transaction_hash?: string
  output: string
  privkey: string
  macistate: string
  cleanup: boolean
}

/*
 * Get the arguments to pass to the genProof function
 */
export function getGenProofArgs(
  args: getGenProofArgsInput
): getGenProofArgsResult {
  const {
    maciAddress,
    providerUrl,
    pollId,
    coordinatorMacisk,
    maciTxHash,
    circuitType,
    circuitDirectory,
    rapidSnark,
    outputDir,
  } = args

  const tallyFile = getTalyFilePath(outputDir)
  const maciStateFile = path.join(outputDir, `macistate`)

  const {
    processZkFile,
    tallyZkFile,
    processWitness,
    processWasm,
    tallyWitness,
    tallyWasm,
  } = getCircuitFiles(circuitType, circuitDirectory)

  // do not cleanup threads after calling genProofs,
  // the script will exit and end threads at the end
  const cleanup = false
  if (isOsArm) {
    return {
      contract: maciAddress,
      eth_provider: providerUrl,
      poll_id: pollId.toString(),
      tally_file: tallyFile,
      process_wasm: processWasm,
      process_zkey: processZkFile,
      tally_zkey: tallyZkFile,
      tally_wasm: tallyWasm,
      transaction_hash: maciTxHash,
      output: outputDir,
      privkey: coordinatorMacisk,
      macistate: maciStateFile,
      cleanup,
    }
  } else {
    if (!rapidSnark) {
      throw new Error('Please specify the path to the rapidsnark binary')
    }

    if (!isPathExist(rapidSnark)) {
      throw new Error(`Path ${rapidSnark} does not exist`)
    }

    return {
      contract: maciAddress,
      eth_provider: providerUrl,
      poll_id: pollId.toString(),
      tally_file: tallyFile,
      rapidsnark: rapidSnark,
      process_witnessgen: processWitness,
      tally_witnessgen: tallyWitness,
      process_zkey: processZkFile,
      tally_zkey: tallyZkFile,
      transaction_hash: maciTxHash,
      output: outputDir,
      privkey: coordinatorMacisk,
      macistate: maciStateFile,
      cleanup,
    }
  }
}

/**
 * Merge MACI message and signups subtrees
 * Must merge the subtrees before calling genProofs
 *
 * @param maciAddress MACI contract address
 * @param pollId Poll id
 * @param numOperations Number of operations to perform for the merge
 */
export async function mergeMaciSubtrees(
  maciAddress: string,
  pollId: string,
  numOperations: number
) {
  await mergeMessages({
    contract: maciAddress,
    poll_id: pollId,
    num_queue_ops: numOperations,
  })

  await mergeSignups({
    contract: maciAddress,
    poll_id: pollId,
    num_queue_ops: numOperations,
  })
}

/**
 * Create a random MACI private key
 *
 * @returns MACI serialized private key
 */
export function newMaciPrivateKey(): string {
  const keypair = new Keypair()
  const secretKey = keypair.privKey.serialize()
  const publicKey = keypair.pubKey.serialize()

  console.log(`SecretKey: ${secretKey}`)
  console.log(`PublicKey: ${publicKey}`)

  return secretKey
}

export { createMessage, getRecipientClaimData, bnSqrt, proveOnChain, genProofs }
