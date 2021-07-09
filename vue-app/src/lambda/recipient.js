import { GoogleSpreadsheet } from 'google-spreadsheet'

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

    const childObj = Object.keys(recipient[header]).reduce(
      (result, subheader) => {
        const key = header + subheader
        return { ...result, [key]: recipient[header][subheader] }
      },
      {}
    )

    return { ...result, ...childObj }
  }, {})
}

exports.handler = async function (event) {
  if (!event.body) {
    return {
      statusCode: 400, // Bad request
    }
  }

  try {
    const recipient = JSON.parse(event.body)

    const creds = JSON.parse(process.env.VUE_APP_GOOGLE_APPLICATION_CREDENTIALS)
    const doc = new GoogleSpreadsheet(process.env.VUE_APP_GOOGLE_SPREADSHEET_ID)
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    const sheet = doc.sheetsByIndex[0]
    sheet.setHeaderRow([
      // Project
      'projectname',
      'projecttagline',
      'projectdescription',
      'projectcategory',
      'projectproblemSpace',
      // Fund
      'fundaddress',
      'fundplans',
      // Team
      'teamname',
      'teamdescription',
      'teamemail',
      // Links
      'linksgithub',
      'linksradicle',
      'linkswebsite',
      'linkstwitter',
      'linksdiscord',
      // Image
      'imagebannerHash',
      'imagethumbnailHash',
      // Etc
      'furthestStep',
    ])

    const row = recipientToRow(recipient)
    await sheet.addRow(row)

    return {
      statusCode: 200,
    }
  } catch (err) {
    console.log(err)
    return {
      statusCode: 500,
    }
  }
}
