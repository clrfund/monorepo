#!/bin/bash
set -e

PKGS="zkeys_10-2-1-2_glibc-211.tar.gz ProcessMessages_10-2-1-2_test.0.zkey TallyVotes_10-1-2_test.0.zkey"

mkdir -p params
cd params


BASE_URL=https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.1.1-aa4ba27/10-2-1-2
for p in $PKGS
do
  url="$BASE_URL/$p"
  echo "downloading $url"
  curl $url -o $p
  extension="${p##*.}"
  if [ "$extension" == "gz" ]
  then
    tar -xvf $p
  fi
done

