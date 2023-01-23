export class Transaction {
  blockNumber: number
  transactionIndex: number

  constructor({
    blockNumber,
    transactionIndex,
  }: {
    blockNumber: number
    transactionIndex: number
  }) {
    this.blockNumber = blockNumber
    this.transactionIndex = transactionIndex
  }

  /**
   * compare the age of the transaction
   * @param tx
   * @returns 0 - same age
   *          1 - newer transaction
   *         -1 - older transaction
   */
  compare(tx: Transaction): number {
    if (
      this.blockNumber === tx.blockNumber &&
      this.transactionIndex === tx.transactionIndex
    ) {
      return 0
    }

    if (this.blockNumber < tx.blockNumber) {
      return -1
    }

    if (
      this.blockNumber === tx.blockNumber &&
      this.transactionIndex < tx.transactionIndex
    ) {
      return -1
    }

    return 1
  }
}
