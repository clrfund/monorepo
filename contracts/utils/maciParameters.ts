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
  maxMessages: number
  maxVoteOptions: number
}

export class MaciParameters {
  stateTreeDepth: number
  intStateTreeDepth: number
  messageTreeSubDepth: number
  messageTreeDepth: number
  voteOptionTreeDepth: number
  maxMessages: number
  maxVoteOptions: number
  processVk: VerifyingKey
  tallyVk: VerifyingKey
  treeDepths: TreeDepths
  maxValues: MaxValues

  constructor(parameters: { [name: string]: any } = {}) {
    this.stateTreeDepth = parameters.stateTreeDepth
    this.intStateTreeDepth = parameters.intStateTreeDepth
    this.messageTreeSubDepth = parameters.messageTreeSubDepth
    this.messageTreeDepth = parameters.messageTreeDepth
    this.voteOptionTreeDepth = parameters.voteOptionTreeDepth
    this.maxMessages = parameters.maxMessages
    this.maxVoteOptions = parameters.maxVoteOptions
    this.processVk = parameters.processVk
    this.tallyVk = parameters.tallyVk
    this.treeDepths = {
      intStateTreeDepth: this.intStateTreeDepth,
      messageTreeSubDepth: this.messageTreeSubDepth,
      messageTreeDepth: this.messageTreeDepth,
      voteOptionTreeDepth: this.voteOptionTreeDepth,
    }
    this.maxValues = {
      maxMessages: this.maxMessages,
      maxVoteOptions: this.maxVoteOptions,
    }
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

    return new MaciParameters({
      stateTreeDepth,
      intStateTreeDepth,
      messageTreeSubDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
      maxMessages,
      maxVoteOptions,
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
      maxValues: { maxMessages: 390625, maxVoteOptions: 25 },
      treeDepths: {
        stateTreeDepth: 6,
        intStateTreeDepth: 2,
        messageTreeSubDepth: 2,
        messageTreeDepth: 8,
        voteOptionTreeDepth: 2,
      },
    }

    return new MaciParameters({
      ...params.maxValues,
      ...params.treeDepths,
      processVk,
      tallyVk: processVk.copy(),
    })
  }
}
