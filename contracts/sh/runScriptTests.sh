#!/bin/bash
set -e

#
# Run the hardhat scripts/tasks to simulate e2e testing
#

# Test settings
NOW=$(date +%s)
export OUTPUT_DIR="./proof_output/${NOW}"
export CIRCUIT=micro
export CIRCUIT_DIRECTORY=${CIRCUIT_DIRECTORY:-"./params"}
export STATE_FILE=${OUTPUT_DIR}/state.json
export TALLY_FILE=${OUTPUT_DIR}/tally.json
export HARDHAT_NETWORK=localhost
export RAPID_SNARK=${RAPID_SNARK:-~/rapidsnark/package/bin/prover}

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

# create a new maci key for the coordinator
MACI_KEYPAIR=$(yarn ts-node cli/newMaciKey.ts)
export COORDINATOR_MACISK=$(echo "${MACI_KEYPAIR}" | grep -o "macisk.*$")

# create a new instance of ClrFund
yarn ts-node cli/newClrFund.ts \
  --circuit "${CIRCUIT}" \
  --directory "${CIRCUIT_DIRECTORY}" \
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

yarn ts-node cli/topup.ts ${STATE_FILE}
yarn ts-node cli/vote.ts ${STATE_FILE}

yarn ts-node cli/timeTravel.ts ${ROUND_DURATION}

# run the tally script
MACI_TRANSACTION_HASH=$(extract 'maciTxHash')
NODE_OPTIONS="--max-old-space-size=4096"
yarn ts-node cli/tally.ts \
  --clrfund ${CLRFUND} \
  --circuit-directory ${CIRCUIT_DIRECTORY} \
  --circuit "${CIRCUIT}" \
  --rapidsnark ${RAPID_SNARK} \
  --batch-size 8 \
  --output-dir ${OUTPUT_DIR} \
  --maci-tx-hash "${MACI_TRANSACTION_HASH}"
 
# finalize the round
yarn ts-node cli/finalize.ts --clrfund "${CLRFUND}" --tally-file ${TALLY_FILE}
 
# claim funds
FUNDING_ROUND=$(extract 'fundingRound')

# amount should be 3200000000000000000 but there's rounding error in division by
# voice credit factor and sqrt for the vote weight
yarn ts-node cli/claim.ts --funding-round "${FUNDING_ROUND}" \
  --recipient-index 1 \
  --amount 3199999999999999999 \
  --tally-file ${TALLY_FILE}

yarn ts-node cli/claim.ts --funding-round "${FUNDING_ROUND}" \
  --recipient-index 2 \
  --amount 3199999999999999999 \
  --tally-file ${TALLY_FILE}

