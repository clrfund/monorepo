#!/usr/bin/env bash
set -e


# Upload the tally.json file in the contracts directory to IPFS
# Run the script in the contracts directory as follow:
#
# Example usage:
# sh/upload-tally.sh
#
# Make sure the PINATA_JWT secret is set in the AWS secrets manager in the region
#   aws scretsmanager create-secret --name PINATA_JWT --region <REGION> --secret-string "SECRET_VALUE"
#
TOKEN=$(curl --silent -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
REGION=$(curl --silent -H "X-aws-ec2-metadata-token: $TOKEN" --silent http://169.254.169.254/latest/dynamic/instance-identity/document | jq -r .region)
PINATA_JWT=$(aws secretsmanager get-secret-value --region $REGION --secret-id PINATA_JWT | jq -r '.SecretString')
curl --location --request POST 'https://api.pinata.cloud/pinning/pinFileToIPFS' \
          --header "Authorization: Bearer ${PINATA_JWT}" \
          --form "file=@"tally.json"

