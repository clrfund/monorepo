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
MACI_KEYPAIR=$(yarn ts-node tasks/maciNewKey.ts)
export COORDINATOR_MACISK=$(echo "${MACI_KEYPAIR}" | grep -o "macisk.*$")

# create a new instance of ClrFund
yarn hardhat new-clrfund \
  --circuit "${CIRCUIT}" \
  --directory "${CIRCUIT_DIRECTORY}" \
  --user-registry-type simple \
  --recipient-registry-type simple \
  --state-file ${STATE_FILE} \
  --network ${HARDHAT_NETWORK}
 
# # deploy a new funding round
CLRFUND=$(extract 'clrfund')
yarn hardhat new-round \
  --clrfund "${CLRFUND}" \
  --duration "${ROUND_DURATION}" \
  --state-file ${STATE_FILE} \
  --network ${HARDHAT_NETWORK}

yarn hardhat test-add-contributors --clrfund "${CLRFUND}" --network ${HARDHAT_NETWORK}
yarn hardhat test-add-recipients --clrfund "${CLRFUND}" --network ${HARDHAT_NETWORK}

yarn hardhat test-contribute --state-file ${STATE_FILE} --network ${HARDHAT_NETWORK}
yarn hardhat test-vote --state-file ${STATE_FILE} --network ${HARDHAT_NETWORK}

yarn hardhat test-time-travel --seconds ${ROUND_DURATION} --network ${HARDHAT_NETWORK}

# run the tally script
MACI_TRANSACTION_HASH=$(extract 'maciTxHash')
NODE_OPTIONS="--max-old-space-size=4096"
yarn hardhat clr-tally \
  --clrfund ${CLRFUND} \
  --circuit-directory ${CIRCUIT_DIRECTORY} \
  --circuit "${CIRCUIT}" \
  --rapidsnark ${RAPID_SNARK} \
  --batch-size 8 \
  --output-dir ${OUTPUT_DIR} \
  --maci-tx-hash "${MACI_TRANSACTION_HASH}" \
  --network "${HARDHAT_NETWORK}"
 
# finalize the round
yarn hardhat clr-finalize --clrfund "${CLRFUND}" --tally-file ${TALLY_FILE}  --network ${HARDHAT_NETWORK}
 
# claim funds
FUNDING_ROUND=$(extract 'fundingRound')
yarn hardhat clr-claim --funding-round "${FUNDING_ROUND}" --tally-file ${TALLY_FILE} \
  --recipient 1 \
  --network ${HARDHAT_NETWORK}

yarn hardhat clr-claim --funding-round "${FUNDING_ROUND}" --tally-file ${TALLY_FILE} \
  --recipient 2 \
  --network ${HARDHAT_NETWORK}
