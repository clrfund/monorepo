const Hash = require('ipfs-only-hash')

export async function getIpfsHash(object: any): Promise<string> {
  const data = Buffer.from(JSON.stringify(object, null, 4))
  return await Hash.of(data)
}
