import { Contract } from 'ethers';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { BigNumber } from 'ethers';
import { bigInt, genRandomSalt } from 'maci-crypto';
import { Keypair, PubKey, Command, Message } from 'maci-domainobjs';

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
    let event;
    try {
      event = contract.interface.parseLog(log);

    } catch (e) {
      console.log("event not from this contract");
    }
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
  coordinatorPubKey: PubKey,
  voteOptionIndex: number,
  voiceCredits: number,
  nonce: number,
  salt?: number,
): [Message, PubKey] {
  const encKeypair = new Keypair();
  if (!salt) {
    salt = genRandomSalt();
  }
  const quadraticVoteWeight = Math.floor(Math.sqrt(voiceCredits));
  const command = new Command(
    bigInt(userStateIndex),
    userKeypair.pubKey,
    bigInt(voteOptionIndex),
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
