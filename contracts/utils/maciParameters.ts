import { Contract } from 'ethers'

import { VerifyingKey } from '@clrfund/maci-domainobjs'
import { extractVk } from '@clrfund/maci-circuits'
import { CIRCUITS } from './circuits'
import path from 'path'

export interface ZkFiles {
  processZkFile: string
  processWitness: string
  processWasm: string
  tallyZkFile: string
  tallyWitness: string
  tallyWasm: string
}

/**
 * Get the zkey file path
 * @param name zkey file name
 * @returns zkey file path
 */
export function getCircuitFiles(circuit: string, directory: string): ZkFiles {
  const params = CIRCUITS[circuit]
  return {
    processZkFile: path.join(directory, params.processMessagesZkey),
    processWitness: path.join(directory, params.processWitness),
    processWasm: path.join(directory, params.processWasm),
    tallyZkFile: path.join(directory, params.tallyVotesZkey),
    tallyWitness: path.join(directory, params.tallyWitness),
    tallyWasm: path.join(directory, params.tallyWasm),
  }
}

export class MaciParameters {
  stateTreeDepth: number
  intStateTreeDepth: number
  messageTreeSubDepth: number
  messageTreeDepth: number
  voteOptionTreeDepth: number
  maxMessages: number
  maxVoteOptions: number
  messageBatchSize: number
  processVk: VerifyingKey
  tallyVk: VerifyingKey

  constructor(parameters: { [name: string]: any } = {}) {
    this.stateTreeDepth = parameters.stateTreeDepth
    this.intStateTreeDepth = parameters.intStateTreeDepth
    this.messageTreeSubDepth = parameters.messageTreeSubDepth
    this.messageTreeDepth = parameters.messageTreeDepth
    this.voteOptionTreeDepth = parameters.voteOptionTreeDepth
    this.maxMessages = parameters.maxMessages
    this.maxVoteOptions = parameters.maxVoteOptions
    this.messageBatchSize = parameters.messageBatchSize
    this.processVk = parameters.processVk
    this.tallyVk = parameters.tallyVk
  }

  asContractParam(): any[] {
    return [
      this.stateTreeDepth,
      {
        intStateTreeDepth: this.intStateTreeDepth,
        messageTreeSubDepth: this.messageTreeSubDepth,
        messageTreeDepth: this.messageTreeDepth,
        voteOptionTreeDepth: this.voteOptionTreeDepth,
      },
      { maxMessages: this.maxMessages, maxVoteOptions: this.maxVoteOptions },
      this.messageBatchSize,
      this.processVk.asContractParam(),
      this.tallyVk.asContractParam(),
    ]
  }

  static async fromConfig(
    circuit: string,
    directory: string
  ): Promise<MaciParameters> {
    const params = CIRCUITS[circuit]
    const { processZkFile, tallyZkFile } = getCircuitFiles(circuit, directory)
    const processVk: VerifyingKey = VerifyingKey.fromObj(
      await extractVk(processZkFile)
    )
    const tallyVk: VerifyingKey = VerifyingKey.fromObj(
      await extractVk(tallyZkFile)
    )

    return new MaciParameters({
      ...params.maxValues,
      ...params.treeDepths,
      ...params.batchSizes,
      processVk,
      tallyVk,
    })
  }

  static async fromContract(maciFactory: Contract): Promise<MaciParameters> {
    const stateTreeDepth = await maciFactory.stateTreeDepth()
    const {
      intStateTreeDepth,
      messageTreeSubDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
    } = await maciFactory.treeDepths()
    const { maxMessages, maxVoteOptions } = await maciFactory.maxValues()
    const messageBatchSize = await maciFactory.messageBatchSize()

    return new MaciParameters({
      stateTreeDepth,
      intStateTreeDepth,
      messageTreeSubDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      maxMessages,
      maxVoteOptions,
      messageBatchSize,
    })
  }

  static mock(circuit: string): MaciParameters {
    const processVk = VerifyingKey.fromObj({
      vk_alpha_1: [1, 2],
      vk_beta_2: [
        [1, 2],
        [1, 2],
      ],
      vk_gamma_2: [
        [1, 2],
        [1, 2],
      ],
      vk_delta_2: [
        [1, 2],
        [1, 2],
      ],
      IC: [[1, 2]],
    })
    const params = CIRCUITS[circuit]
    return new MaciParameters({
      ...params.maxValues,
      ...params.treeDepths,
      ...params.batchSizes,
      processVk,
      tallyVk: processVk.copy(),
    })
  }
}
