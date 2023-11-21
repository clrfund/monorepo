#!/bin/bash
set -e

#
# Run the hardhat scripts/tasks to simulate e2e testing
#

# Test settings
NOW=$(date +%s)
OUTPUT_DIR="./proof_output/${NOW}"
CIRCUIT=micro
NETWORK=localhost
CIRCUIT_DIRECTORY=${CIRCUIT_DIRECTORY:-"./snark-params"}
STATE_FILE=${OUTPUT_DIR}/state.json

# 20 mins
ROUND_DURATION=1800

mkdir -p ${OUTPUT_DIR}

# A helper to extract field value from the JSON state file
# The pattern "field": "value" must be on 1 line
# Usage: extract 'clrfund'
function extract() {
  val=$(cat "${STATE_FILE}" | grep "${1}" | grep -o "[^:]*$" | grep -o '[^",]*')
  echo ${val}
}

# create a ClrFund deployer
yarn hardhat new-deployer \
  --directory "${CIRCUIT_DIRECTORY}" \
  --state-file "${STATE_FILE}" \
  --network "${NETWORK}"
DEPLOYER=$(extract 'deployer')

# create a new maci key for the coordinator
MACI_KEYPAIR=$(yarn hardhat new-maci-key)
MACI_SECRET_KEY=$(echo "${MACI_KEYPAIR}" | grep -o "macisk.*$")

# create a new instance of ClrFund
yarn hardhat new-clrfund --deployer ${DEPLOYER} \
  --user-type simple \
  --recipient-type simple \
  --coordinator-macisk "${MACI_SECRET_KEY}" \
  --state-file "${STATE_FILE}" \
  --network "${NETWORK}"
CLRFUND=$(extract 'clrfund')

# deploy a new funding round
yarn hardhat new-round \
  --clrfund ${CLRFUND} \
  --state-file "${STATE_FILE}" \
  --duration "${ROUND_DURATION}" \
  --network "${NETWORK}"
FUNDING_ROUND=$(extract 'fundingRound')

yarn hardhat add-contributors --clrfund ${CLRFUND} --network "${NETWORK}"
yarn hardhat add-recipients --clrfund ${CLRFUND} --network "${NETWORK}"

yarn hardhat contribute --state-file "${STATE_FILE}" --network "${NETWORK}"
yarn hardhat vote \
  --coordinator-macisk "${MACI_SECRET_KEY}" \
  --state-file "${STATE_FILE}" \
  --network "${NETWORK}"
yarn hardhat time-travel ${ROUND_DURATION} --network "${NETWORK}"

# run the tally script
export CIRCUIT=micro
export CIRCUIT_DIRECTORY="${CIRCUIT_DIRECTORY}"
export CLRFUND="${CLRFUND}"
export STATE_FILE="${STATE_FILE}"
export TALLY_BATCH_SIZE=10
export PROOF_OUTPUT_DIR="${PROOF_OUTPUT_DIR}"
export COORDINATOR_MACISK="${MACI_SECRET_KEY}"
export MACI_TRANSACTION_HASH=$(extract 'maciTxHash')
export OUTPUT_DIR="${OUTPUT_DIR}"
export NODE_OPTIONS=--max-old-space-size=4096
yarn hardhat run scripts/tally.ts --network "${NETWORK}"

# finalize the round
TALLY_FILE=$(extract 'tallyFile')
yarn hardhat finalize \
  --clrfund "${CLRFUND}" \
  --tally-file "${TALLY_FILE}" \
  --network "${NETWORK}"

# claim funds
yarn hardhat claim \
  --funding-round ${FUNDING_ROUND} \
  --network "${NETWORK}"

