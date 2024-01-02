#!/usr/bin/env bash
set -e


# Upload the tally.json file in the contracts directory to IPFS
#
# Usage: ./upload-tally.sh
#
# Make sure the PINATA_JWT secret is set in the AWS secrets manager
#   aws scretsmanager create-secret --name PINATA_JWT --secret-string "SECRET_VALUE"
#

CONTRACTS_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && cd .. && pwd )

cd $CONTRACT_DIR
PINATA_JWT=$(aws secretsmanager get-secret-value --secret-id PINATA_JWT | jq -r '.SecretString')
curl --location --request POST 'https://api.pinata.cloud/pinning/pinFileToIPFS' \
          --header "Authorization: Bearer ${PINATA_JWT}" \
          --form 'file=@"tally.json"'

