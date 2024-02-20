import { ContractTransactionReceipt, Signer } from 'ethers'
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
  Tally as TallyData,
} from '@clrfund/common'
import * as os from 'os'
import {
  mergeMessages,
  mergeSignups,
  genProofs,
  proveOnChain,
  GenProofsArgs,
  genLocalState,
  verify,
} from 'maci-cli'

import { getTalyFilePath, isPathExist } from './misc'
import { getCircuitFiles } from './circuits'
import { FundingRound } from '../typechain-types'

interface TallyResultProof {
  recipientIndex: number
  result: string
  proof: bigint[][]
}

export const isOsArm = os.arch().includes('arm')

export function getTallyResultProof(
  recipientIndex: number,
  recipientTreeDepth: number,
  tally: TallyData
): TallyResultProof {
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
    resultTree.insert(BigInt(leaf))
  }
  const resultProof = resultTree.genProof(recipientIndex)
  return {
    recipientIndex,
    result,
    proof: resultProof.pathElements,
  }
}

export function getTallyResultProofBatch(
  recipientStartIndex: number,
  recipientTreeDepth: number,
  tally: any,
  batchSize: number
): TallyResultProof[] {
  const tallyCount = tally.results.tally.length
  if (recipientStartIndex >= tallyCount) {
    throw new Error('Recipient index out of bound')
  }

  const proofs: TallyResultProof[] = []
  const lastIndex =
    recipientStartIndex + batchSize > tallyCount
      ? tallyCount
      : recipientStartIndex + batchSize

  for (let i = recipientStartIndex; i < lastIndex; i++) {
    proofs.push(getTallyResultProof(i, recipientTreeDepth, tally))
  }

  return proofs
}

export async function addTallyResultsBatch(
  fundingRound: FundingRound,
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
    const proofs = getTallyResultProofBatch(
      i,
      recipientTreeDepth,
      tallyData,
      batchSize
    )

    const tx = await fundingRound.addTallyResultsBatch(
      proofs.map((i) => i.recipientIndex),
      proofs.map((i) => i.result),
      proofs.map((i) => i.proof),
      BigInt(tallyData.results.salt),
      spentVoiceCreditsHash,
      BigInt(perVOSpentVoiceCreditsHash)
    )
    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Failed to add tally results on chain')
    }

    if (callback) {
      // the 2nd element in the data array has the array of
      // recipients to be processed for the batch
      const totalProcessed = i + proofs.length
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
  // MACI state file
  maciStateFile?: string
  // transaction signer
  signer: Signer
  // flag to turn on verbose logging in MACI cli
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
    maciStateFile,
    signer,
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
      stateFile: maciStateFile,
      signer,
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
      stateFile: maciStateFile,
      signer,
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
  signer,
  quiet,
}: {
  maciAddress: string
  pollId: bigint
  signer: Signer
  numQueueOps?: string
  quiet?: boolean
}) {
  if (!maciAddress) throw new Error('Missing MACI address')

  await mergeMessages({
    pollId,
    maciContractAddress: maciAddress,
    numQueueOps,
    signer,
    quiet,
  })

  await mergeSignups({
    pollId,
    maciContractAddress: maciAddress,
    numQueueOps,
    signer,
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

export {
  createMessage,
  getRecipientClaimData,
  bnSqrt,
  genProofs,
  proveOnChain,
  verify,
  genLocalState,
  TallyData,
}
