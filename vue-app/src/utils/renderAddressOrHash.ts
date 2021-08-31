export function renderAddressOrHash(
  address: string,
  digitsToShow?: number
): string {
  if (digitsToShow) {
    const beginDigits: number = Math.ceil(digitsToShow / 2)
    const endDigits: number = Math.floor(digitsToShow / 2)
    const begin: string = address.substr(0, 2 + beginDigits)
    const end: string = address.substr(address.length - endDigits, endDigits)
    return `${begin}…${end}`
  }
  return address
}
