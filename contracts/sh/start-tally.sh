#!/usr/bin/env bash
set -e

#--------------------------------------------------------------------------------------------
# This script runs the tally hardhat task and upload the tally results in tally.json to IPFS
# It is meant to be run in an AWS EC2 instance launched for tallying votes.
# It gets the input parameters for the tally task from the user data of the EC2 instance
# User data format:
#  {
#     "round": "The funding round contract address",
#     "block": "The maci start block",
#     "network": "The blockchain network name",
#     "pubkey": "coordinator maci public key",
#     "coordinator": "coordinator wallet address",
#  }
#
# It gets the coordinator private keys from the AWS secrets manager to run the tally scripts:
# Secret key ids:
#   coordinator_eth_address: <the eth private key>
#   coordinator_maci_public_key: <the maci private key>
#   jsonrpc_url_<network>: the network url
#
# Example usage:
# sh/start-tally.sh
#--------------------------------------------------------------------------------------------

echo $(date) starting tally script...

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
export NODE_CONFIG='{"snarkParamsPath": "/home/ubuntu/params"}'
export NODE_OPTIONS=--max-old-space-size=4096

CONTRACTS_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && cd .. && pwd )
cd $CONTRACTS_DIR

TOKEN=$(curl --silent -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
USER_DATA=$(curl --silent -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/user-data)
REGION=$(curl --silent -H "X-aws-ec2-metadata-token: $TOKEN" --silent http://169.254.169.254/latest/dynamic/instance-identity/document | jq -r .region)

ROUND_ADDRESS=$(echo $USER_DATA | jq -r .round)
MACI_START_BLOCK=$(echo $USER_DATA | jq -r .block)
NETWORK=$(echo $USER_DATA | jq -r .network)
COORDINATOR_ADDRESS=$(echo $USER_DATA | jq -r .coordinator)
COORDINATOR_MACI_PUB_KEY=$(echo $USER_DATA | jq -r .pubkey)
JSONRPC_HTTP_URL=$(aws secretsmanager get-secret-value --region $REGION --secret-id "jsonrpc_url_${NETWORK}" 2>/dev/null | jq -r '.SecretString')

COORDINATOR_ETH_PK=$(aws secretsmanager get-secret-value --region $REGION --secret-id "${COORDINATOR_ADDRESS}" | jq -r '.SecretString')
if [ -z "${COORDINATOR_ETH_PK}" ]; then
  echo Please setup the coordinator ETH private key in the AWS secrets manager
  echo e.g.
  echo aws secretsmanager create-secret --name $COORDINATOR_ADDRESS --secret-string your-private-key --region ${REGION}
  exit -1
fi

COORDINATOR_PK=$(aws secretsmanager get-secret-value --region $REGION --secret-id "${COORDINATOR_MACI_PUB_KEY}" | jq -r '.SecretString')
if [ -z "${COORDINATOR_PK}" ]; then
  echo Please setup the coordinator MACI private key in the AWS secrets manager
  echo e.g.
  echo aws secretsmanager create-secret --name $COORDINATOR_MACI_PUB_KEY --secret-string your-private-key --region ${REGION}
  exit -1
fi

echo COORDINATOR_ETH_PK=${COORDINATOR_ETH_PK} > .env
echo COORDINATOR_PK=${COORDINATOR_PK} >> .env
echo JSONRPC_HTTP_URL=${JSONRPC_HTTP_URL} >> .env

# run the tally script
yarn hardhat tally --round-address $ROUND_ADDRESS --start-block $MACI_START_BLOCK --network $NETWORK

# upload the tally.json file to ipfs
sh/upload-tally.sh

#sh/stop-instance.sh
