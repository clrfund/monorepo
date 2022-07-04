import { expect } from 'chai'
import { MaciParameters } from '../utils/maci'
import { ZERO_ADDRESS } from '../utils/constants'
import { CIRCUITS } from '../utils/deployment'

describe('Maci Parameters', () => {
  it('batch size 8', () => {
    const params = CIRCUITS['test']
    const maci = new MaciParameters({
      batchUstVerifier: ZERO_ADDRESS,
      qvtVerifier: ZERO_ADDRESS,
      ...params.batchSizes,
    })

    const { tallyBatchSize, messageBatchSize } = maci
    expect(tallyBatchSize).to.eq(8)
    expect(messageBatchSize).to.eq(8)
  })

  it('batch size 64', () => {
    const params = CIRCUITS['prod']
    const maci = new MaciParameters({
      batchUstVerifier: ZERO_ADDRESS,
      qvtVerifier: ZERO_ADDRESS,
      ...params.batchSizes,
    })

    const { tallyBatchSize, messageBatchSize } = params.batchSizes
    expect(maci.tallyBatchSize).to.eq(tallyBatchSize)
    expect(maci.messageBatchSize).to.eq(messageBatchSize)
  })
})
