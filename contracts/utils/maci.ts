import { Contract, ContractTransactionReceipt, toNumber } from 'ethers'
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
  GenProofsArgs,
} from 'maci-cli'

import { getTalyFilePath, isPathExist } from './misc'
import { getCircuitFiles } from './circuits'
import fs from 'fs'
import path from 'path'

interface TallyResult {
  recipientIndex: number
  result: string
  proof: any[]
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
  const resultProof = resultTree.genProof(recipientIndex)
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
  callback?: (processed: number, receipt: ContractTransactionReceipt) => void
): Promise<number> {
  let totalGasUsed = 0
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
    totalGasUsed = totalGasUsed + Number(receipt.gasUsed)
  }
  return totalGasUsed
}

/* Input to getGenProofArgs() */
type getGenProofArgsInput = {
  maciAddress: string
  pollId: bigint
  // coordinator's MACI serialized secret key
  coordinatorMacisk: string
  // the transaction hash of the creation of the MACI contract
  maciTxHash?: string
  // the key get zkeys file mapping, see utils/circuits.ts
  circuitType: string
  circuitDirectory: string
  rapidsnark?: string
  // where the proof will be produced
  outputDir: string
  // number of blocks of logs to fetch per batch
  blocksPerBatch: number
  // fetch logs from MACI from these start and end blocks
  startBlock?: number
  endBlock?: number
  // flag to turn on verbose logging in MACI cli
  quiet?: boolean
}

/**
 * GenProof command line arguments
 */
type GenProofCliArgs = {
  outputDir: string
  tallyFile: string
  tallyZkey: string
  processZkey: string
  pollId: bigint
  subsidyFile?: string
  subsidyZkey?: string
  rapidsnark?: string
  processWitgen?: string
  processDatFile?: string
  tallyWitgen?: string
  tallyDatFile?: string
  subsidyWitgen?: string
  subsidyDatFile?: string
  coordinatorPrivKey?: string
  maciAddress?: string
  transactionHash?: string
  processWasm?: string
  tallyWasm?: string
  subsidyWasm?: string
  useWasm?: boolean
  stateFile?: string
  startBlock?: number
  blocksPerBatch?: number
  endBlock?: number
  quiet?: boolean
}

/*
 * Get the arguments to pass to the genProof function
 */
export function getGenProofArgs(args: getGenProofArgsInput): GenProofsArgs {
  const {
    maciAddress,
    pollId,
    coordinatorMacisk,
    maciTxHash,
    circuitType,
    circuitDirectory,
    rapidsnark,
    outputDir,
    blocksPerBatch,
    startBlock,
    endBlock,
    quiet,
  } = args

  const tallyFile = getTalyFilePath(outputDir)

  const {
    processZkFile,
    tallyZkFile,
    processWitness,
    processWasm,
    processDatFile,
    tallyWitness,
    tallyWasm,
    tallyDatFile,
  } = getCircuitFiles(circuitType, circuitDirectory)

  if (isOsArm) {
    return {
      outputDir,
      tallyFile,
      tallyZkey: tallyZkFile,
      processZkey: processZkFile,
      pollId,
      coordinatorPrivKey: coordinatorMacisk,
      maciAddress,
      transactionHash: maciTxHash,
      processWasm,
      tallyWasm,
      useWasm: true,
      blocksPerBatch,
      startBlock,
      endBlock,
      quiet,
    }
  } else {
    if (!rapidsnark) {
      throw new Error('Please specify the path to the rapidsnark binary')
    }

    if (!isPathExist(rapidsnark)) {
      throw new Error(`Path ${rapidsnark} does not exist`)
    }

    return {
      outputDir,
      tallyFile,
      tallyZkey: tallyZkFile,
      processZkey: processZkFile,
      pollId,
      processWitgen: processWitness,
      processDatFile,
      tallyWitgen: tallyWitness,
      tallyDatFile,
      coordinatorPrivKey: coordinatorMacisk,
      maciAddress,
      transactionHash: maciTxHash,
      rapidsnark,
      useWasm: false,
      blocksPerBatch,
      startBlock,
      endBlock,
      quiet,
    }
  }
}

/**
 * Merge MACI message and signups subtrees
 * Must merge the subtrees before calling genProofs
 * @param maciAddress MACI contract address
 * @param pollId Poll id
 * @param numQueueOps Number of operations to perform for the merge
 * @param quiet Whether to log output
 */
export async function mergeMaciSubtrees({
  maciAddress,
  pollId,
  numQueueOps,
  quiet,
}: {
  maciAddress: string
  pollId: bigint
  numQueueOps?: string
  quiet?: boolean
}) {
  if (!maciAddress) throw new Error('Missing MACI address')

  await mergeMessages({
    pollId,
    maciContractAddress: maciAddress,
    numQueueOps,
    quiet,
  })

  await mergeSignups({
    pollId,
    maciContractAddress: maciAddress,
    numQueueOps,
    quiet,
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

export { createMessage, getRecipientClaimData, bnSqrt, genProofs, proveOnChain }
