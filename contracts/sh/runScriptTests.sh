#!/bin/bash
set -e

#
# Run the hardhat scripts/tasks to simulate e2e testing
#

# Test settings
NOW=$(date +%s)
export OUTPUT_DIR="./proof_output/${NOW}"
export CIRCUIT=micro
export NETWORK=localhost
export CIRCUIT_DIRECTORY=${CIRCUIT_DIRECTORY:-"./snark-params"}
export STATE_FILE=${OUTPUT_DIR}/state.json
export HARDHAT_NETWORK=localhost

# 20 mins
ROUND_DURATION=1800

mkdir -p ${OUTPUT_DIR}

# A helper to extract field value from the JSON state file
# The pattern "field": "value" must be on 1 line
# Usage: extract 'clrfund'
function extract() {
  val=$(cat "${STATE_FILE}" | grep -o "${1}\": *\"[^\"]*" | grep -o "[^\"]*$")
  echo ${val}
}

# create a ClrFund deployer
yarn ts-node cli/newDeployer.ts \
  --directory "${CIRCUIT_DIRECTORY}" \
  --state-file "${STATE_FILE}" \
  --circuit "${CIRCUIT}"

# create a new maci key for the coordinator
MACI_KEYPAIR=$(yarn ts-node cli/newMaciKey.ts)
export COORDINATOR_MACISK=$(echo "${MACI_KEYPAIR}" | grep -o "macisk.*$")

# create a new instance of ClrFund
DEPLOYER=$(extract 'deployer')
yarn ts-node cli/newClrfund.ts \
  --deployer "${DEPLOYER}" \
  --user-registry-type simple \
  --recipient-registry-type simple \
  --state-file ${STATE_FILE}
 
# # deploy a new funding round
CLRFUND=$(extract 'clrfund')
yarn ts-node cli/newRound.ts \
  --clrfund "${CLRFUND}" \
  --duration "${ROUND_DURATION}" \
  --state-file ${STATE_FILE}

yarn ts-node cli/addContributors.ts "${CLRFUND}"
yarn ts-node cli/addRecipients.ts "${CLRFUND}"

yarn ts-node cli/contribute.ts ${STATE_FILE}
yarn ts-node cli/vote.ts ${STATE_FILE}

yarn ts-node cli/timeTravel.ts ${ROUND_DURATION}

# run the tally script
MACI_TRANSACTION_HASH=$(extract 'maciTxHash')
NODE_OPTIONS="--max-old-space-size=4096"
yarn ts-node cli/tally.ts \
  --clrfund ${CLRFUND} \
  --circuit-directory "${CIRCUIT_DIRECTORY}" \
  --circuit "${CIRCUIT}" \
  --batch-size 8 \
  --output-dir "${OUTPUT_DIR}" \
  --maci-tx-hash "${MACI_TRANSACTION_HASH}" \
  --state-file ${STATE_FILE}
 
# # finalize the round
TALLY_FILE=$(extract 'tallyFile')
yarn ts-node cli/finalize.ts --clrfund "${CLRFUND}" --tally-file ${TALLY_FILE}
 
# claim funds
FUNDING_ROUND=$(extract 'fundingRound')
yarn ts-node cli/claim.ts --funding-round "${FUNDING_ROUND}" --tally-file ${TALLY_FILE}

