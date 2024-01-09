#!/usr/bin/env bash

# This script is used to install all the software used to run the MACI genProofs
# and proveOnChain scripts.  The instance can be used to create the AMI used to
# launch new instances
#
# Example usage:
# sh/prepare-ec2.sh
#
#

sudo apt update
sudo apt-get install -y cmake build-essential libgmp-dev libsodium-dev nlohmann-json3-dev nasm g++ curl

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | bash -s -- -y
. $HOME/.cargo/env

echo installing zkutil...
cargo install zkutil --version 0.3.2

echo installing nvm...
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

nvm install 16.20.2
nvm use v16.20.2
npm install -g yarn

git clone https://github.com/clrfund/monorepo.git

./monorepo/.github/scripts/download-batch64-params.sh

cd monorepo
git checkout feat/aws-scripts
yarn
cd contracts && yarn build
