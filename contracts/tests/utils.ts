import { BigNumber, Contract } from 'ethers';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { bigInt, genRandomSalt } from 'maci-crypto';
import { Keypair, PubKey, Command, Message } from 'maci-domainobjs';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const UNIT = BigNumber.from(10).pow(BigNumber.from(18))
export const VOICE_CREDIT_FACTOR = BigNumber.from(10).pow(4 + 18 - 9)

export function bnSqrt(a: BigNumber): BigNumber {
  // Take square root from a big number
  // https://stackoverflow.com/a/52468569/1868395
  let x
  let x1 = a.div(2)
  do {
    x = x1
    x1 = (x.add(a.div(x))).div(2)
  } while (!x.eq(x1))
  return x
}

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
    if (log.address != contract.address) {
      continue;
    }
    const event = contract.interface.parseLog(log);
    if (event && event.name === eventName) {
      return event.args[argumentName];
    }
  }
  throw new Error('Event not found');
}

export class MaciParameters {

  // Defaults
  stateTreeDepth = 4;
  messageTreeDepth = 4;
  voteOptionTreeDepth = 2;
  tallyBatchSize = 4;
  messageBatchSize = 4;
  signUpDuration = 7 * 86400;
  votingDuration = 7 * 86400;

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

export function createMessage(
  userStateIndex: number,
  userKeypair: Keypair,
  newUserKeypair: Keypair | null,
  coordinatorPubKey: PubKey,
  voteOptionIndex: number | null,
  voiceCredits: BigNumber | null,
  nonce: number,
  salt?: number,
): [Message, PubKey] {
  const encKeypair = new Keypair();
  if (!salt) {
    salt = genRandomSalt();
  }
  const quadraticVoteWeight = voiceCredits ? bnSqrt(voiceCredits) : 0
  const command = new Command(
    bigInt(userStateIndex),
    newUserKeypair ? newUserKeypair.pubKey : userKeypair.pubKey,
    bigInt(voteOptionIndex || 0),
    bigInt(quadraticVoteWeight),
    bigInt(nonce),
    bigInt(salt),
  );
  const signature = command.sign(userKeypair.privKey);
  const message = command.encrypt(
    signature,
    Keypair.genEcdhSharedKey(encKeypair.privKey, coordinatorPubKey),
  );
  return [message, encKeypair.pubKey];
}
