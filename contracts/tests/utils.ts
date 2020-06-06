import { TransactionResponse } from 'ethers/providers';
import { BigNumber } from 'ethers/utils/bignumber';

export async function getGasUsage(transaction: TransactionResponse): Promise<Number | null> {
  const receipt = await transaction.wait();
  if (receipt.status === 1) {
    return (receipt.gasUsed as BigNumber).toNumber();
  } else {
    return null;
  }
}
