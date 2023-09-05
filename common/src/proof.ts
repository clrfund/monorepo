import { utils, providers } from 'ethers'

/**
 * RLP encode the proof returned from eth_getProof
 * @param proof proof from the eth_getProof
 * @returns
 */
export function rlpEncodeProof(proof: string[]) {
  const decodedProof = proof.map((node: string) => utils.RLP.decode(node))

  return utils.RLP.encode(decodedProof)
}

/**
 * The storage key used in eth_getProof and eth_getStorageAt
 * @param account Account address
 * @param slotIndex Slot index of the balanceOf storage
 * @returns storage key used in the eth_getProof params
 */
export function getStorageKey(account: string, slotIndex: number) {
  return utils.keccak256(
    utils.concat([
      utils.hexZeroPad(account, 32),
      utils.hexZeroPad(utils.hexValue(slotIndex), 32),
    ])
  )
}

/**
 * Get proof from eth_getProof
 * @param params Parameter fro eth_getProof
 * @returns proof returned from eth_getProof
 */
async function getProof(
  params: Array<string | string[]>,
  provider: providers.JsonRpcProvider
): Promise<any> {
  try {
    const proof = await provider.send('eth_getProof', params)
    return proof
  } catch (err) {
    console.error(
      'Unable to get proof. Your node may not support eth_getProof. Try a different provider such as Infura',
      err
    )
    throw err
  }
}
/**
 * Get the storage proof
 * @param token Token contract address
 * @param blockHash The block hash to get the proof for
 * @param provider provider to connect to the node
 * @returns proof returned from eth_getProof
 */
export async function getAccountProof(
  token: string,
  blockHash: string,
  provider: providers.JsonRpcProvider
): Promise<any> {
  const params = [token, [], blockHash]
  return getProof(params, provider)
}

/**
 * Get the storage proof
 * @param token Token contract address
 * @param blockHash The block hash to get the storage proof for
 * @param userAccount User account to get the proof for
 * @param storageSlotIndex The storage index for the balanceOf storage
 * @param provider provider to connect to the node
 * @returns proof returned from eth_getProof
 */
export async function getStorageProof(
  token: string,
  blockHash: string,
  userAccount: string,
  storageSlotIndex: number,
  provider: providers.JsonRpcProvider
): Promise<any> {
  const storageKey = getStorageKey(userAccount, storageSlotIndex)

  const params = [token, [storageKey], blockHash]
  return getProof(params, provider)
}
