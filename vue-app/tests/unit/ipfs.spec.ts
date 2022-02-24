import { expect } from 'chai'
import { Ipfs } from '@/api/ipfs'
import * as isIPFS from 'is-ipfs'

describe('Ipfs', () => {
  it('creates valid ipfs url', () => {
    const hash = 'QmaDy75RkRVtZcbYeqMDLcCK8dDvahfik68zP7FbpxvD2F'
    const url = Ipfs.toUrl(hash)
    console.log('url', url)
    expect(isIPFS.url(url)).to.eq(true)
  })
})
