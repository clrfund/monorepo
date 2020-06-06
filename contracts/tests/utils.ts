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

export class MaciParameters {

  // Defaults for tests
  stateTreeDepth = 4;
  messageTreeDepth = 4;
  voteOptionTreeDepth = 2;
  tallyBatchSize = 2;
  messageBatchSize = 2;
  signUpDuration = 3600;
  votingDuration = 3600;

  constructor(parameters: {[name: string]: number} = {}) {
    for (const [name, value] of Object.entries(parameters)) {
      (this as any)[name] = value;
    }
  }

  values(): number[] {
    // To be passed to setMaciParameters()
    return [
      this.stateTreeDepth,
      this.messageTreeDepth,
      this.voteOptionTreeDepth,
      this.tallyBatchSize,
      this.messageBatchSize,
      this.signUpDuration,
      this.votingDuration,
    ];
  }
}
