import { decodeBase64, encodeBase64, toUtf8Bytes } from 'ethers'
import nacl from 'tweetnacl'
import type { Handler } from '@netlify/functions'

const NODE_URL = process.env.VITE_BRIGHTID_NODE_URL || 'https://app.brightid.org/node/v6'

// these fields must be in alphabetical because
// BrightID nodes use 'fast-json-stable-stringify' that sorts fields
type BrightIDMessage = {
  app: string
  appUserId: string
  name: string
  sig?: string
  timestamp: number
  v: number
}

/**
 *  Returns an error object
 * @param errorMessage error message
 * @returns error object
 */
function makeError(errorMessage: string, errorNum: number) {
  const body = JSON.stringify({ error: errorMessage, errorNum })
  return { statusCode: 400, body }
}

/**
 * Returns the result with statusCode and body
 * @param result the result
 * @returns result object
 */
function makeResult(result: any) {
  const body = JSON.stringify(result)
  return { statusCode: 200, body }
}

/**
 * Get the unused sponsorship amount
 * @param context - the context to retrieve unused sponsorships for
 *
 * @returns the number of sponsorships available to the specified `context`
 */
async function unusedSponsorships(context: string) {
  const endpoint = `${NODE_URL}/apps/${context}`
  const response = await fetch(endpoint)
  const json = await response.json()

  if (json['errorMessage']) {
    throw new Error(JSON.stringify(json))
  }

  const data = json['data']
  return data.unusedSponsorships || 0
}

async function handleSponsorRequest(userAddress: string) {
  const endpoint = process.env.VITE_BRIGHTID_SPONSOR_API_URL
  if (!endpoint) {
    throw new Error('Environment variable VITE_BRIGHTID_SPONSOR_API_URL not set')
  }

  const brightIdSponsorKey = process.env.VITE_BRIGHTID_SPONSOR_KEY_FOR_NETLIFY
  if (!brightIdSponsorKey) {
    throw new Error('Environment variable VITE_BRIGHTID_SPONSOR_KEY_FOR_NETLIFY not set')
  }

  const CONTEXT = process.env.VITE_BRIGHTID_CONTEXT
  if (!CONTEXT) {
    throw new Error('Environment variable VITE_BRIGHTID_CONTEXT not set')
  }

  const sponsorships = await unusedSponsorships(CONTEXT)
  if (typeof sponsorships === 'number' && sponsorships < 1) {
    throw new Error('BrightID sponsorships not available')
  }
  if (typeof sponsorships !== 'number') {
    throw new Error('Invalid BrightID sponsorship')
  }

  const timestamp = Date.now()

  const op: BrightIDMessage = {
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

  if (json.error) {
    return makeError(json.errorMessage, json.errorNum)
  }

  if (json.data) {
    return makeResult({ hash: json.data.hash })
  }

  return makeError('Unexpected result from the BrightID sponsorship API.', 500)
}

/**
 * Submit a sponsorship request using the BrightID api
 * @param event contains user address to sponsor
 * @returns sponsor data or error
 */
export const handler: Handler = async event => {
  if (!event.body) {
    return makeError('Missing request body', 400)
  }

  try {
    const jsonBody = JSON.parse(event.body)
    if (!jsonBody.userAddress) {
      return makeError('Missing userAddress in request body: ' + event.body, 400)
    }

    return await handleSponsorRequest(jsonBody.userAddress)
  } catch (err) {
    return makeError(err.message, 500)
  }
}
