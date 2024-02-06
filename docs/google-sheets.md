# Google Sheets integration

An optional feature when running a round as an admin is collect contact email addresses and to pipe recipient application data to a Google Sheet. This can help facilitate coordination with round recipients, e.g. if you'd like to notify recipients of round updates (such as the launch of a new round) or to perform KYC on applicants before adding them to the recipient registry.

**Note: this is only available if using the optimistic recipient registry and the frontend application is deployed via Netlify.**

## How it works

If you'd like to use this feature, you must add the Google Sheet environment variables in `vue-app/.env`. If no Google Sheet credentials are provided in `vue-app/.env`, the `email` field on the recipient Join form will not be displayed and the integration will be disabled.

Two new env variables must be added:

- `GOOGLE_APPLICATION_CREDENTIALS`: service account credentials in a json string (something in this form: `{"type": "...", "private_key": "...", ...}`)
  - create google service account (https://cloud.google.com/iam/docs/service-accounts-create)
  - create service account key
  - download the account credential file with the json string
  - enable the google sheets api (https://console.cloud.google.com/apis/library/sheets.googleapis.com)
- `VITE_GOOGLE_SPREADSHEET_ID`: the spreadsheet id that is going to be used
  - the spreadsheet id is auto-generated when you create a google spreadsheet
  - make sure to grant edit access to the service account
  - make sure the spreadsheet has a header with the following fields
      |projectname |projecttagline |projectdescription |projectcategory |projectproblemSpace|fundaddressName |fundresolvedAddress |fundplans |teamname |teamdescription |teamemail |linksgithub |linksradicle |linkswebsite |linkstwitter |linksdiscord |imagebannerHash |imagethumbnailHash |
      | ---------- | ------------- |------------- | ------------- | ------------- |------------- | ------------- | ------------- |------------- | ------------- | ------------- |------------- |------------- | ------------- |------------- | ------------- | ------------- |------------- |

- `GOOGLE_SHEET_NAME`: the google sheet name, default to Sheet1 if not defined


[Learn more about setting up Google authentication credentials](https://cloud.google.com/docs/authentication/getting-started).

If the environment variables are present, we send the form data to a Netlify function (which uses AWS Lambda under the hood). The Netlify function uses the API wrapper `google-spreadsheet` to pipe the data to your Google Sheet.

You can view the function logic in `vue-app/lambda/recipient.js`.

## Testing locally

In order to test it, you need to install the Netlify CLI (https://docs.netlify.com/cli/get-started/) in your machine, it is not included in the deps. Once you have that:

1. install everything by running `yarn`
2. run `yarn start:node` in one terminal
3. build and deploy the subgraph locally (check instructions [here](./subgraph.md))
4. run `yarn deploy:local` in a different terminal
5. run `netlify dev` in a different terminal in the vue-app folder

With that, you will have the lambda functions in `/.netlify/functions/{function}`.


# Testing using curl
For example, if the netlify function is deployed on `https://clrfund-testnet.netlify.app`,

```
curl -H "Content-Type: application/json" \
    -d '{"project": { "name": "testtest", "tagline": "blah blah"}}' \
    https://clrfund-testnet.netlify.app/.netlify/functions/recipient
```
