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
sudo apt-get install -y cmake build-essential libgmp-dev libsodium-dev nlohmann-json3-dev nasm g++ curl jq unzip

# install aws cli
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# install rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | bash -s -- -y
. $HOME/.cargo/env

# install zkutil
cargo install zkutil --version 0.3.2

# install nvm
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

nvm install 16.20.2
nvm use v16.20.2
npm install -g yarn

# create logs directory
mkdir -p logs

# get clrfund
git clone https://github.com/clrfund/monorepo.git

# download the zk circuit params
./monorepo/.github/scripts/download-batch64-params.sh

cd monorepo
git checkout feat/aws-scripts
yarn
cd contracts && yarn build

# install the cron job to start the tally task at instance reboot
crontab -l > tmpcron
echo "@reboot /home/ubuntu/monorepo/contracts/sh/start-tally-with-logging.sh" >> tmpcron
crontab tmpcron
rm tmpcron awscliv2.zip