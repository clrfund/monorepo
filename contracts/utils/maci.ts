import { bigInt, SnarkBigInt, IncrementalQuinTree } from 'maci-crypto'

export function getRecipientClaimData(
  recipientAddress: string,
  recipientIndex: number,
  tally: any,
): any[] {
  const TREE_DEPTH = 2
  // Create proof for tally result
  const result = tally.results.tally[recipientIndex]
  const resultSalt = tally.results.salt
  const resultTree = new IncrementalQuinTree(TREE_DEPTH, bigInt(0))
  for (const leaf of tally.results.tally) {
    resultTree.insert(leaf)
  }
  const resultProof = resultTree.genMerklePath(recipientIndex)
  // Create proof for total amount of spent voice credits
  const spent = tally.totalVoiceCreditsPerVoteOption.tally[recipientIndex]
  const spentSalt = tally.totalVoiceCreditsPerVoteOption.salt
  const spentTree = new IncrementalQuinTree(TREE_DEPTH, bigInt(0))
  for (const leaf of tally.totalVoiceCreditsPerVoteOption.tally) {
    spentTree.insert(leaf)
  }
  const spentProof = spentTree.genMerklePath(recipientIndex)

  return [
    recipientAddress,
    result,
    resultProof.pathElements.map((x) => x.map((y: SnarkBigInt) => y.toString())),
    resultSalt,
    spent,
    spentProof.pathElements.map((x) => x.map((y: SnarkBigInt) => y.toString())),
    spentSalt,
  ]
}
