// custom configuration for MACI parameters
// See https://github.com/privacy-scaling-explorations/maci/wiki/Precompiled-v1.1.1 for parameter definition
// NOTE: currently the version of MACI used in clrfund only supports circuit 6-9-2-3 because
// the EmptyBallotRoots.sol published in MACI npm package is hardcoded for stateTreeDepth = 6

import path from 'path'

// This should match MACI.TREE_ARITY in the contract
const TREE_ARITY = 5

export const DEFAULT_CIRCUIT = 'micro'

/**
 * Information about the circuit
 */
export type CircuitInfo = {
  processMessagesZkey: string
  processWitness: string
  processWasm: string
  processDatFile: string
  tallyVotesZkey: string
  tallyWitness: string
  tallyWasm: string
  tallyDatFile: string
  stateTreeDepth: number
  treeDepths: {
    messageTreeDepth: number
    messageTreeSubDepth: number
    voteOptionTreeDepth: number
    intStateTreeDepth: number
  }
  maxValues: {
    maxMessages: bigint
    maxVoteOptions: bigint
  }
  messageBatchSize: bigint
}

export const CIRCUITS: { [name: string]: CircuitInfo } = {
  micro: {
    processMessagesZkey: 'ProcessMessages_6-9-2-3/processMessages_6-9-2-3.zkey',
    processWitness:
      'ProcessMessages_6-9-2-3/ProcessMessages_6-9-2-3_cpp/ProcessMessages_6-9-2-3',
    processWasm:
      'ProcessMessages_6-9-2-3/ProcessMessages_6-9-2-3_js/ProcessMessages_6-9-2-3.wasm',
    processDatFile:
      'ProcessMessages_6-9-2-3/ProcessMessages_6-9-2-3_cpp/ProcessMessages_6-9-2-3.dat',
    tallyVotesZkey: 'TallyVotes_6-2-3/tallyVotes_6-2-3.zkey',
    tallyWitness: 'TallyVotes_6-2-3/TallyVotes_6-2-3_cpp/TallyVotes_6-2-3',
    tallyWasm: 'TallyVotes_6-2-3/TallyVotes_6-2-3_js/TallyVotes_6-2-3.wasm',
    tallyDatFile: 'TallyVotes_6-2-3/TallyVotes_6-2-3_cpp/TallyVotes_6-2-3.dat',
    // 1st param in processmessages_6-9-2-3
    stateTreeDepth: 6,
    treeDepths: {
      // 2nd param in processmessages_6-9-2-3
      messageTreeDepth: 9,
      // 3rd param in processmessages_6-9-2-3
      messageTreeSubDepth: 2,
      // last param of processMessages_6-9-2-3 and tallyvotes_6-2-3
      voteOptionTreeDepth: 3,
      // 2nd param in tallyvotes_6-2-3
      intStateTreeDepth: 2,
    },
    maxValues: {
      // maxMessages and maxVoteOptions are calculated using treeArity = 5 as seen in the following code:
      // https://github.com/privacy-scaling-explorations/maci/blob/master/contracts/contracts/Poll.sol#L115
      // treeArity ** messageTreeDepth
      maxMessages: BigInt(TREE_ARITY ** 9),
      // treeArity ** voteOptionTreeDepth
      maxVoteOptions: BigInt(TREE_ARITY ** 3),
    },
    messageBatchSize: BigInt(TREE_ARITY ** 2),
  },
}

/**
 * List of all the circuit files used by MACI commands
 */
export interface ZkFiles {
  processZkFile: string
  processWitness: string
  processWasm: string
  processDatFile: string
  tallyZkFile: string
  tallyWitness: string
  tallyWasm: string
  tallyDatFile: string
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
    processDatFile: path.join(directory, params.processDatFile),
    tallyZkFile: path.join(directory, params.tallyVotesZkey),
    tallyWitness: path.join(directory, params.tallyWitness),
    tallyWasm: path.join(directory, params.tallyWasm),
    tallyDatFile: path.join(directory, params.tallyDatFile),
  }
}
