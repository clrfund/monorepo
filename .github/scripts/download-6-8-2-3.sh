#!/bin/bash
set -e

BASE_URL="https://maci-zkeys.s3.amazonaws.com/v1.1.0/6-8-2-3"
PKGS="maci-zkeys-6-8-2-3.tar.gz"

mkdir -p params
cd params


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

mv zkeys/* .
rm -rf zkeys
