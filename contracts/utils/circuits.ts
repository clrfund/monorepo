// custom configuration for MACI parameters
// See https://github.com/privacy-scaling-explorations/maci/wiki/Precompiled-v1.1.1 for parameter definition
// TODO: currently the version of MACI used in clrfund only supports circuit 6-8-2-3 because stateTreeDepth = 6 in MACI contract

const TREE_ARITY = 5

export const CIRCUITS: { [name: string]: any } = {
  micro: {
    processMessagesZkey: 'processmessages_6-8-2-3_final.zkey',
    processWitness: 'processMessages_6-8-2-3_test',
    processWasm: 'processmessages_6-8-2-3.wasm',
    tallyVotesZkey: 'tallyvotes_6-2-3_final.zkey',
    tallyWitness: 'tallyVotes_6-2-3_test',
    tallyWasm: 'tallyvotes_6-2-3.wasm',
    treeDepths: {
      //
      stateTreeDepth: 6,
      messageTreeDepth: 8,
      // TODO: confirm if messageBatchTreeDepth is the same as _messageTreeSubDepth in TreeDepths.
      // see https://github.com/clrfund/maci-v1/blob/b5ea1ed4a10c14dc133f8d61e886120cda240003/cli/ts/deployPoll.ts#L153
      // TODO: is messageBatchTreeDepth == intStateTreeDepth??
      messageTreeSubDepth: 2,
      voteOptionTreeDepth: 3,
      // TODO: confirm if intStateTreeDepth is the 2nd param in tallyVotes.circom
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
    batchSizes: {
      // TODO: confirm the following mapping
      // https://github.com/privacy-scaling-explorations/maci/blob/master/contracts/contracts/MACI.sol#L259
      // treeArity ** messageBatchTreeDepth
      messageBatchSize: TREE_ARITY ** 2,
    },
  },
}
