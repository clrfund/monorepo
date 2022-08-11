/**
 * Fund Receiving Address
 */
export class ReceivingAddress {
  /**
   * Convert the receiving addresses from string to a lookup dictionary
   * @param addresses array of EIP3770 addresses (e.g. eth:0x1234...)
   * @returns a dictionary of chain short name to address
   */
  static fromArray(addresses: string[]): Record<string, string> {
    const result: Record<string, string> = addresses.reduce(
      (addresses, item) => {
        const chainAddress = item.split(':')

        if (chainAddress.length === 2) {
          addresses[chainAddress[0]] = chainAddress[1]
        }
        return addresses
      },
      {}
    )

    return result
  }

  /**
   * Convert a chain-address dictionary to an array of EIP3770 addresses
   * @param addresses a dictionary with chain short name to address
   * @returns an array of EIP3770 addresses
   */
  static toArray(addresses: Record<string, string>): string[] {
    return Object.entries(addresses).map(
      ([chain, address]) => `${chain}:${address}`
    )
  }
}
