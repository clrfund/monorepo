import { Contract, BigNumberish } from 'ethers'

import { VerifyingKey } from 'maci-domainobjs'
import { extractVk } from 'maci-circuits'
import { CIRCUITS, getCircuitFiles } from './circuits'
import { TREE_ARITY } from './constants'
import { Params } from '../typechain-types/contracts/MACIFactory'

type TreeDepths = {
  intStateTreeDepth: number
  messageTreeSubDepth: number
  messageTreeDepth: number
  voteOptionTreeDepth: number
}

export class MaciParameters {
  stateTreeDepth: number
  processVk: VerifyingKey
  tallyVk: VerifyingKey
  treeDepths: TreeDepths

  constructor(parameters: { [name: string]: any } = {}) {
    this.stateTreeDepth = parameters.stateTreeDepth
    this.processVk = parameters.processVk
    this.tallyVk = parameters.tallyVk
    this.treeDepths = {
      intStateTreeDepth: parameters.intStateTreeDepth,
      messageTreeSubDepth: parameters.messageTreeSubDepth,
      messageTreeDepth: parameters.messageTreeDepth,
      voteOptionTreeDepth: parameters.voteOptionTreeDepth,
    }
  }

  /**
   * Calculate the message batch size
   * @returns message batch size
   */
  getMessageBatchSize(): number {
    return TREE_ARITY ** this.treeDepths.messageTreeSubDepth
  }

  asContractParam(): [
    _stateTreeDepth: BigNumberish,
    _treeDepths: Params.TreeDepthsStruct,
  ] {
    return [
      this.stateTreeDepth,
      {
        intStateTreeDepth: this.treeDepths.intStateTreeDepth,
        messageTreeSubDepth: this.treeDepths.messageTreeSubDepth,
        messageTreeDepth: this.treeDepths.messageTreeDepth,
        voteOptionTreeDepth: this.treeDepths.voteOptionTreeDepth,
      },
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

    return new MaciParameters({
      stateTreeDepth,
      intStateTreeDepth,
      messageTreeSubDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
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
      treeDepths: {
        intStateTreeDepth: 2,
        messageTreeSubDepth: 2,
        messageTreeDepth: 8,
        voteOptionTreeDepth: 2,
      },
    }

    return new MaciParameters({
      stateTreeDepth: 6,
      ...params.treeDepths,
      processVk,
      tallyVk: processVk.copy(),
    })
  }
}
