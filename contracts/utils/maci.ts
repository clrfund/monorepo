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
  genProofs as maciGenProofs,
  proveOnChain as maciProveOnChain,
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
export function getGenProofArgs(args: getGenProofArgsInput): GenProofCliArgs {
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
 * This is just temporary solution until the issue is resolved:
 * https://github.com/privacy-scaling-explorations/maci/issues/1039
 */
function ensureContractAddressFileExist() {
  fs.writeFileSync(
    path.join(
      path.dirname(__dirname),
      '/node_modules/maci-cli/build/contractAddresses.json'
    ),
    JSON.stringify({})
  )
}

/**
 * Merge MACI message and signups subtrees
 * Must merge the subtrees before calling genProofs
 * @param maciAddress MACI contract address
 * @param pollId Poll id
 * @param numOperations Number of operations to perform for the merge
 */
export async function mergeMaciSubtrees({
  maciAddress,
  pollId,
  numOperations,
  quiet,
}: {
  maciAddress: string
  pollId: bigint
  numOperations: number
  quiet?: boolean
}) {
  if (!maciAddress) throw new Error('Missing MACI address')

  // this is to work around issue https://github.com/privacy-scaling-explorations/maci/issues/1039
  ensureContractAddressFileExist()

  const pollIdAsNumber = toNumber(pollId)
  const numOperationsAsString = numOperations.toString()

  await mergeMessages(pollIdAsNumber, maciAddress, numOperationsAsString, quiet)
  await mergeSignups(pollIdAsNumber, maciAddress, numOperationsAsString, quiet)
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

/**
 * This function is a temporary wrapper for MACI genProofs command until the MACI genProofs
 * changed to take an object argument
 * @param genProofArgs an object with all the arguments for the MACI genProofs command
 */
export async function genProofs(genProofArgs: GenProofCliArgs): Promise<void> {
  const pollId = toNumber(genProofArgs.pollId)

  await maciGenProofs(
    genProofArgs.outputDir,
    genProofArgs.tallyFile,
    genProofArgs.tallyZkey,
    genProofArgs.processZkey,
    pollId,
    genProofArgs.subsidyFile,
    genProofArgs.subsidyZkey,
    genProofArgs.rapidsnark,
    genProofArgs.processWitgen,
    genProofArgs.processDatFile,
    genProofArgs.tallyWitgen,
    genProofArgs.tallyDatFile,
    genProofArgs.subsidyWitgen,
    genProofArgs.subsidyDatFile,
    genProofArgs.coordinatorPrivKey,
    genProofArgs.maciAddress,
    genProofArgs.transactionHash,
    genProofArgs.processWasm,
    genProofArgs.tallyWasm,
    genProofArgs.subsidyWasm,
    genProofArgs.useWasm,
    genProofArgs.stateFile,
    genProofArgs.startBlock,
    genProofArgs.blocksPerBatch,
    genProofArgs.endBlock,
    genProofArgs.quiet
  )
}

/**
 * Structure to store the proveOnChain arguments
 */
type proveOnChainCliArgs = {
  pollId: bigint
  proofDir: string
  subsidyEnabled: boolean
  maciAddress?: string
  messageProcessorAddress?: string
  tallyAddress?: string
  subsidyAddress?: string
  quiet?: boolean
}

/**
 * This function is a temporary wrapper for the MACI proveOnChain function until
 * the function is changed back to taking 1 argument object as opposed to positional arguments
 * @param arg an object containging all the proveOnChain arguments
 */
export async function proveOnChain(arg: proveOnChainCliArgs) {
  await maciProveOnChain(
    arg.pollId.toString(),
    arg.proofDir,
    arg.subsidyEnabled,
    arg.maciAddress,
    arg.messageProcessorAddress,
    arg.tallyAddress,
    arg.subsidyAddress,
    arg.quiet
  )
}

export { createMessage, getRecipientClaimData, bnSqrt }
