import { StandardMerkleTree } from '@openzeppelin/merkle-tree'

/**
 * Load users into a merkle tree
 * @param users Users to load
 * @returns user merkle tree
 */
export function loadUserMerkleTree(
  users: string[]
): StandardMerkleTree<string[]> {
  const tree = StandardMerkleTree.of(
    users.map((user) => [user.toLowerCase()]),
    ['address']
  )
  return tree
}

/**
 * Get the merkle proof for the user
 * @param userAccount User wallet address to get the proof for
 * @param userMerkleTree The merkle tree containing all approved users
 * @returns
 */
export function getUserMerkleProof(
  userAccount: string,
  userMerkleTree: StandardMerkleTree<string[]>
): string[] | null {
  try {
    return userMerkleTree.getProof([userAccount.toLowerCase()])
  } catch (err) {
    console.log('userAccount', userAccount.toLowerCase())
    console.log('getUserMerkleProof error', err)
    return null
  }
}

export { StandardMerkleTree }
