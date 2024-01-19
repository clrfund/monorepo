// custom configuration for MACI parameters
// See https://github.com/privacy-scaling-explorations/maci/wiki/Precompiled-v1.1.1 for parameter definition
// NOTE: currently the version of MACI used in clrfund only supports circuit 6-8-2-3 because
// the EmptyBallotRoots.sol published in MACI npm package is hardcoded for stateTreeDepth = 6

import path from 'path'

const TREE_ARITY = 5

export const DEFAULT_CIRCUIT = 'micro'

export const CIRCUITS: { [name: string]: any } = {
  micro: {
    processMessagesZkey: 'processmessages_6-8-2-3_final.zkey',
    processWitness: 'processMessages_6-8-2-3_test',
    processWasm: 'processmessages_6-8-2-3.wasm',
    processDatFile: 'processMessages_6-8-2-3_test.dat',
    tallyVotesZkey: 'tallyvotes_6-2-3_final.zkey',
    tallyWitness: 'tallyVotes_6-2-3_test',
    tallyWasm: 'tallyvotes_6-2-3.wasm',
    tallyDatFile: 'tallyVotes_6-2-3_test.dat',
    treeDepths: {
      // 1st param in processmessages_6-8-2-3
      stateTreeDepth: 6,
      // 2nd param in processmessages_6-8-2-3
      messageTreeDepth: 8,
      // 3rd param in processmessages_6-8-2-3
      messageTreeSubDepth: 2,
      // last param of processMessages_6-8-2-3 and tallyvotes_6-2-3
      voteOptionTreeDepth: 3,
      // intStateTreeDepth is the 2nd param in tallyVotes.circom
      intStateTreeDepth: 2,
    },
    maxValues: {
      // maxMessages and maxVoteOptions are calculated using treeArity = 5 as seen in the following code:
      // https://github.com/privacy-scaling-explorations/maci/blob/master/contracts/contracts/Poll.sol#L115
      // treeArity ** messageTreeDepth
      maxMessages: TREE_ARITY ** 8,
      // treeArity ** voteOptionTreeDepth
      maxVoteOptions: TREE_ARITY ** 3,
    },
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
