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
sudo apt-get install cmake build-essential libgmp-dev libsodium-dev nlohmann-json3-dev nasm g++ curl

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install zkutil --version 0.3.2

curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash 
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

nvm install 16.20.2
nvm use v16.20.2
npm install -g yarn

git clone https://github.com/clrfund/monorepo.git

cd monorepo
yarn
cd contract && yarn build
