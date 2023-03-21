import { utils } from 'ethers'
import nacl from 'tweetnacl'

const NODE_URL =
  process.env.VUE_APP_BRIGHTID_NODE_URL || 'https://app.brightid.org/node/v6'

/**
 *  Returns an error object
 * @param errorMessage error message
 * @returns error object
 */
function makeError(errorMessage, errorNum) {
  const body = JSON.stringify({ error: errorMessage, errorNum })
  return { statusCode: 400, body }
}

/**
 * Returns the result with statusCode and body
 * @param result the result
 * @returns result object
 */
function makeResult(result) {
  const body = JSON.stringify(result)
  return { statusCode: 200, body }
}

/**
 * Get the unused sponsorship amount
 * @param context - the context to retrieve unused sponsorships for
 *
 * @returns the number of sponsorships available to the specified `context`
 */
async function unusedSponsorships(context) {
  const endpoint = `${NODE_URL}/apps/${context}`
  const response = await fetch(endpoint)
  const json = await response.json()

  if (json['errorMessage']) {
    throw new Error(JSON.stringify(json))
  }

  const data = json['data']
  return data.unusedSponsorships || 0
}

async function handleSponsorRequest(userAddress) {
  const endpoint = process.env.VUE_APP_BRIGHTID_SPONSOR_API_URL
  const brightIdSponsorKey =
    process.env.VUE_APP_BRIGHTID_SPONSOR_KEY_FOR_NETLIFY

  const CONTEXT = process.env.VUE_APP_BRIGHTID_CONTEXT

  if (!brightIdSponsorKey) {
    throw new Error(
      'Environment variable VUE_APP_BRIGHTID_SPONSOR_KEY_FOR_NETLIFY not set'
    )
  }

  const sponsorships = await unusedSponsorships(CONTEXT)
  if (typeof sponsorships === 'number' && sponsorships < 1) {
    throw new Error('BrightID sponsorships not available')
  }
  if (typeof sponsorships !== 'number') {
    throw new Error('Invalid BrightID sponsorship')
  }

  const timestamp = Date.now()

  // these fields must be in alphabetical because
  // BrightID nodes use 'fast-json-stable-stringify' that sorts fields
  const op = {
    app: CONTEXT,
    appUserId: userAddress,
    name: 'Sponsor',
    timestamp,
    v: 6,
  }

  const message = JSON.stringify(op)
  const arrayedMessage = Buffer.from(message)
  const arrayedKey = utils.base64.decode(brightIdSponsorKey)
  const signature = nacl.sign.detached(arrayedMessage, arrayedKey)
  op.sig = utils.base64.encode(signature)

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

  return makeError('Unexpected result from the BrightID sponsorship API.')
}

/**
 * Submit a sponsorship request using the BrightID api
 * @param event contains user address to sponsor
 * @returns sponsor data or error
 */
exports.handler = async function (event) {
  if (!event.body) {
    return makeError('Missing request body')
  }

  try {
    const jsonBody = JSON.parse(event.body)
    if (!jsonBody.userAddress) {
      return makeError('Missing userAddress in request body: ' + event.body)
    }

    return await handleSponsorRequest(jsonBody.userAddress)
  } catch (err) {
    return makeError(err.message)
  }
}
