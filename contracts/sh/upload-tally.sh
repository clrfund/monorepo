#!/usr/bin/env bash
set -e


# Upload the tally.json file in the contracts directory to IPFS
# Run the script in the contracts directory as follow:
#
# sh/upload-tally.sh
#
# Make sure the PINATA_JWT secret is set in the AWS secrets manager
#   aws scretsmanager create-secret --name PINATA_JWT --secret-string "SECRET_VALUE"
#

PINATA_JWT=$(aws secretsmanager get-secret-value --secret-id PINATA_JWT | jq -r '.SecretString')
curl --location --request POST 'https://api.pinata.cloud/pinning/pinFileToIPFS' \
          --header "Authorization: Bearer ${PINATA_JWT}" \
          --form 'file=@"tally.json"'

