import { Contract } from 'ethers'

import { VerifyingKey } from 'maci-domainobjs'
import { extractVk } from 'maci-circuits'
import { CIRCUITS, getCircuitFiles } from './circuits'

type TreeDepths = {
  intStateTreeDepth: number
  messageTreeSubDepth: number
  messageTreeDepth: number
  voteOptionTreeDepth: number
}

type MaxValues = {
  maxMessages: bigint
  maxVoteOptions: bigint
}

export class MaciParameters {
  stateTreeDepth: number
  messageBatchSize: bigint
  processVk: VerifyingKey
  tallyVk: VerifyingKey
  treeDepths: TreeDepths
  maxValues: MaxValues

  constructor(parameters: { [name: string]: any } = {}) {
    this.stateTreeDepth = parameters.stateTreeDepth
    this.messageBatchSize = parameters.messageBatchSize
    this.processVk = parameters.processVk
    this.tallyVk = parameters.tallyVk
    this.treeDepths = {
      intStateTreeDepth: parameters.intStateTreeDepth,
      messageTreeSubDepth: parameters.messageTreeSubDepth,
      messageTreeDepth: parameters.messageTreeDepth,
      voteOptionTreeDepth: parameters.voteOptionTreeDepth,
    }
    this.maxValues = {
      maxMessages: parameters.maxMessages,
      maxVoteOptions: parameters.maxVoteOptions,
    }
  }

  asContractParam(): any[] {
    return [
      this.stateTreeDepth,
      {
        intStateTreeDepth: this.treeDepths.intStateTreeDepth,
        messageTreeSubDepth: this.treeDepths.messageTreeSubDepth,
        messageTreeDepth: this.treeDepths.messageTreeDepth,
        voteOptionTreeDepth: this.treeDepths.voteOptionTreeDepth,
      },
      {
        maxMessages: this.maxValues.maxMessages,
        maxVoteOptions: this.maxValues.maxVoteOptions,
      },
      this.messageBatchSize,
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
      stateTreeDepth: params.stateTreeDepth,
      ...params.maxValues,
      ...params.treeDepths,
      messageBatchSize: params.messageBatchSize,
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

  static mock(): MaciParameters {
    const processVk = VerifyingKey.fromObj({
      protocol: 1,
      curve: 1,
      nPublic: 1,
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
      vk_alphabeta_12: [[[1, 2, 3]]],
      IC: [[1, 2]],
    })

    // use smaller voteOptionTreeDepth for testing
    const params = {
      maxValues: { maxMessages: BigInt(390625), maxVoteOptions: BigInt(25) },
      treeDepths: {
        intStateTreeDepth: 2,
        messageTreeSubDepth: 2,
        messageTreeDepth: 8,
        voteOptionTreeDepth: 2,
      },
    }

    return new MaciParameters({
      stateTreeDepth: 6,
      ...params.maxValues,
      ...params.treeDepths,
      messageBatchSize: BigInt(25),
      processVk,
      tallyVk: processVk.copy(),
    })
  }
}
