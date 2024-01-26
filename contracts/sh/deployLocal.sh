#!/bin/bash
set -e

#
# Run the hardhat scripts/tasks to simulate e2e testing
#

# Local settings
export CLRFUND_ROOT=$(cd $(dirname $0) && cd ../.. && pwd)
export CONTRACTS_DIRECTORY=${CLRFUND_ROOT}/contracts
export CIRCUIT=micro
export NETWORK=localhost
export CIRCUIT_DIRECTORY=${CONTRACTS_DIRECTORY}/params
export HARDHAT_NETWORK=localhost
export STATE_FILE=${CONTRACTS_DIRECTORY}/local-state.json

# download the circuit params if not exists
if ! [ -f "${CIRCUIT_DIRECTORY}/processMessages_6-8-2-3_test" ]; then
  ${CLRFUND_ROOT}/.github/scripts/download-6-8-2-3.sh
fi

# 20 mins
ROUND_DURATION=1800

# A helper to extract field value from the JSON state file
# The pattern "field": "value" must be on 1 line
# Usage: extract 'clrfund'
function extract() {
  val=$(cat "${STATE_FILE}" | grep -o "${1}\": *\"[^\"]*" | grep -o "[^\"]*$")
  echo ${val}
}

# create a new maci key for the coordinator
MACI_KEYPAIR=$(yarn ts-node cli/newMaciKey.ts)
export COORDINATOR_MACISK=$(echo "${MACI_KEYPAIR}" | grep -o "macisk.*$")

# create a new instance of ClrFund
DEPLOYER=$(extract 'deployer')
yarn ts-node cli/newClrFund.ts \
  --circuit "${CIRCUIT}" \
  --directory "${CIRCUIT_DIRECTORY}" \
  --user-registry-type simple \
  --recipient-registry-type simple \
  --state-file ${STATE_FILE}
 
# deploy a new funding round
CLRFUND=$(extract 'clrfund')
yarn ts-node cli/newRound.ts \
  --clrfund "${CLRFUND}" \
  --duration "${ROUND_DURATION}" \
  --state-file ${STATE_FILE}
