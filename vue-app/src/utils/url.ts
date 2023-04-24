import { utils } from 'ethers'

export function getAssetsUrl(path) {
  return new URL(`/src/assets/${path}`, import.meta.url).href
}

export async function getRoundsUrl(roundAddress: string) {
  try {
    const indexUrl = new URL(`/src/rounds/rounds.json`, import.meta.url).href
    const roundRecords = await utils.fetchJson(indexUrl)

    if (roundRecords) {
      const roundRecord = roundRecords.find(record => {
        return record.address === roundAddress
      })

      if (roundRecord) {
        return new URL(`/src/rounds/${roundRecord.network}/${roundAddress}.json`, import.meta.url).href
      }
    }
  } catch {
    // ignore error
  }

  return null
}
