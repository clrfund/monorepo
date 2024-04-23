#!/bin/bash
set -e

BASE_URL="https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v1.2.0"
PKGS="maci_artifacts_6-9-2-3_prod.tar.gz"

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

mv zkeys params
rm maci_artifacts_6-9-2-3_prod.tar.gz
