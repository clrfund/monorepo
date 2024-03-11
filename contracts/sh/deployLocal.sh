#!/bin/bash
set -e

#
# Run the hardhat tasks to deploy contracts to local network
#

# Local settings
export CLRFUND_ROOT=$(cd $(dirname $0) && cd ../.. && pwd)
export CONTRACTS_DIRECTORY=${CLRFUND_ROOT}/contracts
export NETWORK=localhost

# the sample config has default configuration for localhost deployment
cp deploy-config-example.json deploy-config.json

# download the circuit params if not exists
if ! [ -f "${CONTRACTS_DIRECTORY}/params/ProcessMessages_6-9-2-3/ProcessMessages_6-9-2-3.zkey" ]; then
  ${CLRFUND_ROOT}/.github/scripts/download-6-9-2-3.sh
fi

# create a new maci key for the coordinator
MACI_KEYPAIR=$(yarn hardhat new-maci-key)
export COORDINATOR_MACISK=$(echo "${MACI_KEYPAIR}" | grep -o "macisk.*$")

# create a new instance of ClrFund
yarn hardhat new-clrfund --network ${NETWORK}
 
# deploy a new funding round
yarn hardhat new-round --network ${NETWORK}
