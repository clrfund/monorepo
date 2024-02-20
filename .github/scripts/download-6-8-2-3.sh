#!/bin/bash
set -e

# TODO: replace this with params from public ceremony
BASE_URL="https://maci-zkeys.s3.amazonaws.com/v1.1.2/6-8-2-3"
PKGS="maci-zkeys-6-8-2-3.tar.gz"

for p in $PKGS
do
  url="$BASE_URL/$p"
  echo "downloading $url"
  curl $url -o $p
  extension="${p##*.}"
  if [ "$extension" == "gz" ]
  then
    tar -zxvf $p
  fi
done
