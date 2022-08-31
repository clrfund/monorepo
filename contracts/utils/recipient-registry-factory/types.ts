import { BigNumberish } from 'ethers'

// Recipient Registry Contructor Arguments
export type RecipientRegistryConstructorArgs = {
  controller: string
  baseDeposit?: BigNumberish
  challengePeriodDuration?: BigNumberish
}
