/**
 * Convert the unix timestamp in seconds to javascript date object
 * @param unixTime unix timestamp in seconds
 * @returns javascript date object
 */
export function toDate(unixTime: any) {
  return new Date(Number(unixTime) * 1000)
}
