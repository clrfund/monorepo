import { utils } from 'ethers'
import { operator } from './core'
import { AsnParser } from '@peculiar/asn1-schema'
import { SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { ECDSASigValue } from '@peculiar/asn1-ecc'
import _ec from 'elliptic'

const TIMEOUT = 60000
const ES256 = -7
const PublicKeyCredentialType = 'public-key'

type Signature = {
  r: ArrayBuffer
  s: ArrayBuffer
}

let _curve: _ec.ec = null
function getCurve(): _ec.ec {
  if (!_curve) {
    _curve = new _ec.ec('p256')
  }
  return _curve
}

/**
 * Determine if the DER-specific `00` byte at the start of an ECDSA signature byte sequence
 * should be removed based on the following logic:
 *
 * "If the leading byte is 0x0, and the the high order bit on the second byte is not set to 0,
 * then remove the leading 0x0 byte"
 */
function shouldRemoveLeadingZero(bytes: Uint8Array): boolean {
  return bytes[0] === 0x0 && (bytes[1] & (1 << 7)) !== 0
}

function recoverPubKey(digest: Uint8Array, signature: Signature): string[] {
  const result: string[] = []
  const curve = getCurve()
  for (let i = 0; i < 2; i++) {
    try {
      result.push(
        '0x' + curve.recoverPubKey(digest, signature, i).encode('hex', false)
      )
    } catch (error) {
      // ignore error
    }
  }
  return result
}

/**
 * Parse the credential and return a list of public keys
 *
 * @param credential public key credential object returned from authentication
 * @returns list of public keys recovered from the signature
 */
export function recoverPubKeyFromCredential(credential: any): string[] {
  const { authenticatorData, clientDataJSON, signature } = credential.response
  const clientDataHash = utils.sha256(new Uint8Array(clientDataJSON))
  const digest = utils.arrayify(
    utils.sha256(
      utils.concat([new Uint8Array(authenticatorData), clientDataHash])
    )
  )

  const parsedSignature = AsnParser.parse(signature, ECDSASigValue)

  const rBytes = new Uint8Array(parsedSignature.r)
  if (shouldRemoveLeadingZero(rBytes)) {
    parsedSignature.r = utils.arrayify(utils.hexDataSlice(rBytes, 1))
  }
  const sBytes = new Uint8Array(parsedSignature.s)
  if (shouldRemoveLeadingZero(sBytes)) {
    parsedSignature.s = utils.arrayify(utils.hexDataSlice(sBytes, 1))
  }

  return recoverPubKey(digest, parsedSignature)
}

/**
 * Return the uncompressed key format if the input key is compressed
 *
 * @param key public key to normal
 * @returns normalized public key
 */
function normalizePublicKey(key: ArrayBuffer): string {
  const bytes = new Uint8Array(key)

  if (bytes.length !== 65 && bytes.length !== 33) {
    throw new Error('Invalid public key')
  }

  if (bytes.length === 65) {
    return utils.hexlify(bytes)
  }

  const uncompressedKey = getCurve()
    .keyFromPublic(bytes)
    .getPublic(false, 'hex')

  return `0x${uncompressedKey}`
}

/**
 * Create and get the PublicKeyCredential, use the public key to generate
 * the encryption key used to generate the MACI key
 */
export class Credential {
  walletAddress: string

  constructor(walletAddress: string) {
    this.walletAddress = walletAddress
  }

  async create(): Promise<string> {
    const challenge = utils.randomBytes(32)
    const id = utils.randomBytes(32)

    const pubKeyCredParam = {
      type: PublicKeyCredentialType,
      alg: ES256,
    } as PublicKeyCredentialParameters

    const publicKey = {
      challenge,
      rp: {
        name: operator,
      },
      user: {
        id,
        name: this.walletAddress,
        displayName: this.walletAddress,
      },
      pubKeyCredParams: [pubKeyCredParam],
      timeout: TIMEOUT,
    }

    const credential = (await navigator.credentials.create({
      publicKey,
    })) as any // PublicKeyCredential, to avoid build error

    const response = credential.response as any // AuthenticatorAttestationResponse
    if (!response.getPublicKey) {
      throw new Error('Get public key not supported, try a newer browser')
    }

    const publicKeyBuffer = response.getPublicKey()
    if (!publicKeyBuffer) {
      throw new Error('Unable to get public key, try a newer browser')
    }

    const pubKey = AsnParser.parse(publicKeyBuffer, SubjectPublicKeyInfo)
    const pubKeyHex = normalizePublicKey(pubKey.subjectPublicKey)
    return pubKeyHex
  }

  async get(): Promise<string[]> {
    const challenge = utils.randomBytes(32)
    const publicKey = {
      challenge,
      timeout: TIMEOUT,
    }

    const credential = await navigator.credentials.get({
      publicKey,
    })

    return recoverPubKeyFromCredential(credential)
  }
}
