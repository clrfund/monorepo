import { Contract, encodeBytes32String, toUtf8Bytes, decodeBase64, encodeBase64 } from 'ethers'
import type { TransactionResponse, Signer } from 'ethers'

import { BrightIdUserRegistry } from './abi'
import { brightIdSponsorKey, brightIdNodeUrl } from './core'
import nacl from 'tweetnacl'

const BRIGHTID_APP_URL = 'https://app.brightid.org'
const NODE_URL = brightIdNodeUrl
const CONTEXT = import.meta.env.VITE_BRIGHTID_CONTEXT || 'clr.fund'

/**
 * These errors from the BrightID sponsor api can be ignored
 * https://github.com/BrightID/BrightID-Node/blob/8093479a60da07c3cd2be32fe4fd8382217c966e/web_services/foxx/brightid/errors.js
 *
 * 39 - The app generated id was sponsored before
 * 63 - Spend request for this app-generated id submitted before.
 * 68 - The app has sent this sponsor request recently
 */
const IGNORE_BRIGHTID_ERRORS = [39, 63, 68]

/**
 * Check if the error number is in the ignore list.
 * @param errorNum error number to check
 * @returns true if the error is one of the IGNORE_BRIGHTID_ERROS
 */
function canIgnoreError(errorNum: number) {
  /* eslint-disable-next-line no-console */
  console.warn('BrightID error', errorNum)
  return IGNORE_BRIGHTID_ERRORS.includes(errorNum)
}

export interface BrightId {
  isVerified: boolean // If is verified in BrightID
  verification?: Verification
}

export interface Verification {
  unique: boolean
  appUserId: string
  verificationHash: string
  sig: { r: string; s: string; v: number }
  timestamp: number
  app: string
}

export interface Sponsorship {
  timestamp: number
  app: string
  appHasAuthorized: boolean
  spendRequested: boolean
}

type AppData = {
  id: string
  name: string
  context?: string
  verification: string
  verifications?: string[]
  verificationsUrl: string
  logo?: string
  url?: string
  assignedSponsorships?: number
  unusedSponsorships?: number
  testing?: boolean
  idAsHex?: boolean
  usingBlindSig?: boolean
  verificationExpirationLength?: number
  sponsorPublicKey?: string
  nodeUrl?: string
  soulbound: boolean
  callbackUrl?: string
}

type SponsorOperation = {
  name: string
  app: string
  appUserId: string
  timestamp: number
  v: number
  sig?: string
}

type SponsorData = {
  hash?: string
  error?: string
}

export async function selfSponsor(registryAddress: string, signer: Signer): Promise<TransactionResponse> {
  const registry = new Contract(registryAddress, BrightIdUserRegistry, signer)
  const userAddress = await signer.getAddress()
  const transaction = await registry.sponsor(userAddress)
  return transaction
}

// This link is for generating QR code
export function getBrightIdLink(userAddress: string): string {
  const deepLink = `brightid://link-verification/${CONTEXT}/${userAddress}`
  return deepLink
}

// This is for mobile app to launch BrightId app
export function getBrightIdUniversalLink(userAddress: string): string {
  const deepLink = `${BRIGHTID_APP_URL}/link-verification/${CONTEXT}/${userAddress}`
  return deepLink
}

export class BrightIdError extends Error {
  code?: number

  constructor(code?: number) {
    const message = code ? `BrightID error ${code}` : 'Unexpected error'
    super(message)
    // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-388605613
    Object.setPrototypeOf(this, BrightIdError.prototype)
    this.code = code
  }
}

export async function getVerification(userAddress: string): Promise<Verification> {
  const apiUrl = `${NODE_URL}/verifications/${CONTEXT}/${userAddress}?signed=eth&timestamp=seconds`
  // bypass the cache so we get the status change sooner
  const response = await fetch(apiUrl, { cache: 'no-store' })
  const data = await response.json()

  if (data['error']) {
    throw new BrightIdError(data['errorNum'])
  } else {
    return data['data'][0]
  }
}

export async function registerUser(
  registryAddress: string,
  verification: Verification,
  signer: Signer,
): Promise<TransactionResponse> {
  const registry = new Contract(registryAddress, BrightIdUserRegistry, signer)
  const transaction = await registry.register(
    encodeBytes32String(CONTEXT),
    verification.appUserId,
    '0x' + verification.verificationHash,
    verification.timestamp,
    verification.sig.v,
    '0x' + verification.sig.r,
    '0x' + verification.sig.s,
  )
  return transaction
}

export async function getBrightId(contextId: string): Promise<BrightId> {
  const brightId: BrightId = {
    isVerified: false,
  }

  try {
    const verification = await getVerification(contextId)
    // the `unique` field tell us if the user is a verified user
    brightId.isVerified = !!verification.unique
    brightId.verification = verification
  } catch (error) {
    if (!(error instanceof BrightIdError)) {
      /* eslint-disable-next-line no-console */
      console.error(error)
    }
  }
  return brightId
}

/**
 * Get the unused sponsorship amount
 * @param context - the context to retrieve unused sponsorships for
 *
 * @returns Returns the number of sponsorships available to the specified `context`
 */
async function unusedSponsorships(context: string): Promise<number> {
  const endpoint = `${NODE_URL}/apps/${context}`
  const response = await fetch(endpoint)
  const json = await response.json()

  if (json['errorMessage']) {
    throw new Error(JSON.stringify(json))
  }

  const data = json['data'] as AppData
  return data.unusedSponsorships || 0
}

/**
 * Call the BrightID sponsor operation endpoint to put a sponsorship request for the user
 * @param userAddress user wallet address
 * @returns sponsporship result or error
 */
export async function brightIdSponsor(userAddress: string): Promise<SponsorData> {
  const endpoint = `${NODE_URL}/operations`

  if (!brightIdSponsorKey) {
    return { error: 'BrightId sponsor key not set' }
  }

  const sponsorships = await unusedSponsorships(CONTEXT)
  if (typeof sponsorships === 'number' && sponsorships < 1) {
    return { error: 'BrightID sponsorships not available' }
  }

  if (typeof sponsorships !== 'number') {
    return { error: 'Invalid BrightID sponsorship' }
  }

  const timestamp = Date.now()

  // these fields must be in alphabetical because
  // BrightID nodes use 'fast-json-stable-stringify' that sorts fields
  const op: SponsorOperation = {
    app: CONTEXT,
    appUserId: userAddress,
    name: 'Sponsor',
    timestamp,
    v: 6,
  }

  const message = JSON.stringify(op)
  const arrayedMessage = toUtf8Bytes(message)
  const arrayedKey = decodeBase64(brightIdSponsorKey)
  const signature = nacl.sign.detached(arrayedMessage, arrayedKey)
  op.sig = encodeBase64(signature)

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(op),
  })
  const json = await res.json()

  if (json['error']) {
    if (canIgnoreError(json.errorNum)) {
      // sponsorship already sent recently, ignore this error
      return { hash: '0x0' }
    }
    return { error: json['errorMessage'] }
  } else {
    return json['data']
  }
}

/**
 * Call the netlify function to invoke the BrightId sponsor api
 * @param userAddress user wallet address
 * @returns sponsorship data or error
 */
async function netlifySponsor(userAddress: string): Promise<SponsorData> {
  const res = await fetch('/.netlify/functions/sponsor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userAddress }),
  })

  const json = await res.json()
  if (res.status === 200) {
    return json
  }

  if (res.status === 400 && canIgnoreError(json.errorNum)) {
    return { hash: '0x0' }
  }

  // return the error
  return json
}

/**
 * Sponsor a BrightID user using the sponsorship api
 * @param userAddress user wallet address
 * @returns sponsporship result or error
 */
export async function sponsorUser(userAddress: string): Promise<SponsorData> {
  if (brightIdSponsorKey) {
    return brightIdSponsor(userAddress)
  }

  try {
    return await netlifySponsor(userAddress)
  } catch (err) {
    if (err instanceof Error) {
      return { error: (err as Error).message }
    } else {
      return { error: 'Unknown sponsorhip error' }
    }
  }
}
