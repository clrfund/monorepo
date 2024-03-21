#!/bin/bash
set -e

#
# Run the hardhat scripts/tasks to simulate e2e testing
#

# Test settings
NOW=$(date +%s)
export OUTPUT_DIR="./proof_output/${NOW}"
export TALLY_FILE=${OUTPUT_DIR}/tally.json
export HARDHAT_NETWORK=localhost
export RAPID_SNARK=${RAPID_SNARK:-~/rapidsnark/package/bin/prover}
export ROUND_DURATION=1000

mkdir -p ${OUTPUT_DIR}

# create a deploy config using the example version
cp deploy-config-example.json deploy-config.json

# create a new maci key for the coordinator
MACI_KEYPAIR=$(yarn hardhat new-maci-key)
export COORDINATOR_MACISK=$(echo "${MACI_KEYPAIR}" | grep -o "macisk.*$")

# create a new instance of ClrFund
yarn hardhat new-clrfund --network ${HARDHAT_NETWORK}
 
# deploy a new funding round
yarn hardhat new-round --round-duration ${ROUND_DURATION} --network ${HARDHAT_NETWORK}

yarn hardhat add-recipients --network ${HARDHAT_NETWORK}
yarn hardhat contribute --network ${HARDHAT_NETWORK}

yarn hardhat time-travel --seconds ${ROUND_DURATION} --network ${HARDHAT_NETWORK}

# run the tally script
NODE_OPTIONS="--max-old-space-size=4096"
yarn hardhat tally \
  --rapidsnark ${RAPID_SNARK} \
  --batch-size 8 \
  --output-dir ${OUTPUT_DIR} \
  --network "${HARDHAT_NETWORK}"
 
# finalize the round
yarn hardhat finalize --tally-file ${TALLY_FILE} --network ${HARDHAT_NETWORK}
 
# claim funds
yarn hardhat claim --recipient 1 --tally-file ${TALLY_FILE}  --network ${HARDHAT_NETWORK}
yarn hardhat claim --recipient 2 --tally-file ${TALLY_FILE}  --network ${HARDHAT_NETWORK}
