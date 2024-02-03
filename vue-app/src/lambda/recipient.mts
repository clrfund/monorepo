import { GoogleSpreadsheet } from 'google-spreadsheet'
import type { Handler } from '@netlify/functions'

const GOOGLE_SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Raw'

/**
 * Creates an object row from a RecipientApplicationData. A row is a key-value
 * object where the keys are composed by the concatenation of the nested keys.
 *
 * From:
 * const recipient = {
 *    project: {
 *      name: "test",
 *      tagline: "string",
 *      description: "string",
 *      category: "string",
 *      problemSpace: "string",
 *    },
 *    ...
 * };
 *
 * To:
 * const row = { projectname: "test", projecttagline: "string", ... }
 */
function recipientToRow(recipient) {
  return Object.keys(recipient).reduce((result, header) => {
    if (typeof recipient[header] !== 'object') {
      return { ...result, [header]: recipient[header] }
    }

    const childObj = Object.keys(recipient[header]).reduce((result, subheader) => {
      const key = header + subheader
      return { ...result, [key]: recipient[header][subheader] }
    }, {})

    return { ...result, ...childObj }
  }, {})
}

export const handler: Handler = async event => {
  if (!event.body) {
    return {
      statusCode: 400, // Bad request
      body: JSON.stringify({ error: 'Missing request body' }),
    }
  }

  try {
    const recipient = JSON.parse(event.body)
    const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
    if (!credential) {
      throw new Error('Environment variable GOOGLE_APPLICATION_CREDENTIALS not set')
    }
    const creds = JSON.parse(credential)

    const doc = new GoogleSpreadsheet(process.env.VITE_GOOGLE_SPREADSHEET_ID)
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    const sheet = doc.sheetsByTitle[GOOGLE_SHEET_NAME]
    const row = recipientToRow(recipient)
    await sheet.addRow(row)

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success' }),
    }
  } catch (err) {
    console.log(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
