import { Contract } from 'ethers';
import { TransactionResponse } from 'ethers/providers';
import { BigNumber } from 'ethers/utils/bignumber';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export async function getGasUsage(transaction: TransactionResponse): Promise<number | null> {
  const receipt = await transaction.wait();
  if (receipt.status === 1) {
    return (receipt.gasUsed as BigNumber).toNumber();
  } else {
    return null;
  }
}

export async function getEventArg(
  transaction: TransactionResponse,
  contract: Contract,
  eventName: string,
  argumentName: string,
): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const receipt = await transaction.wait();
  for (const log of receipt.logs || []) {
    const event = contract.interface.parseLog(log);
    if (event && event.name === eventName) {
      return event.values[argumentName];
    }
  }
  throw new Error('Event not found');
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
      (this as any)[name] = value; // eslint-disable-line @typescript-eslint/no-explicit-any
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
