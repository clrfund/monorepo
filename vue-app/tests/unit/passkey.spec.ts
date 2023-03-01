import { expect } from 'chai'
import { recoverPubKeyFromCredential } from '@/api/passkey'

const testPublicKey1 =
  '0x04b72fca2401e8b534cb50749da3b139af696d7f84dd5d6c0d96629ea53f1edd42c2131fa3be3673ce909e62f9f903afc50799eb08ff82a8b99c2c1d6041601a8d'
const testPublicKey2 =
  '0x04c2aee982392bb151f1038f372266b53b6c3ee619cf4ec02c074fbd6b05329e275642172e272593f546747d7048c0e6e3ecf5ce7608e6206b411fdd59dadfbd27'

describe.only('Passkey recoverPubKeyFromCredential', () => {
  describe('for valid signatures', () => {
    it('should return a valid public key', async () => {
      const response = {
        authenticatorData: Buffer.from(
          '49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
          'hex'
        ),
        clientDataJSON: Buffer.from(
          '7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a2230346844397570706f6c6b584249752d4a714c6a69616f6856436d6d664445496a54396f42617476724a34222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303830222c2263726f73734f726967696e223a66616c73657d',
          'hex'
        ),
        signature: Buffer.from(
          '3044022069881e6e6a8bafe837bbc8da514a3b037ffc733a1de80fbfbacd08f22b5e2b230220386187cd49149b1db7fb5d710e171d0ada630c29b70e5e5d5308d82c01404af0',
          'hex'
        ),
      }
      const pubKeys = await recoverPubKeyFromCredential({ response })
      expect(pubKeys).to.include(testPublicKey1)
    })
  })
  describe('for signatures that needs to trim leading zero', () => {
    it('should return a valid public key', async () => {
      const response = {
        authenticatorData: Buffer.from(
          '49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
          'hex'
        ),
        clientDataJSON: Buffer.from(
          '7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a224a747673556d6e456f714e414e447350586d4854796a4e6c4642477347466b67317855414350786935416b222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303830222c2263726f73734f726967696e223a66616c73657d',
          'hex'
        ),
        signature: Buffer.from(
          '3046022100bd98d33286a0085d5aa39e81904c3ad7d61dd4db3b91cc7809ea8747799dd208022100d93cd0d56ab5723f44f30acffecc4506732d9cc5fce78f03752e2baf6c2e51b7',
          'hex'
        ),
      }
      const pubKeys = await recoverPubKeyFromCredential({ response })
      expect(pubKeys).to.include(testPublicKey2)
    })
  })
})
