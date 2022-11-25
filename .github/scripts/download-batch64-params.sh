#!/bin/bash
set -e

PKGS="batchUstCustom.r1cs batchUstCustom batchUstCustom.params qvtCircuitCustom.r1cs qvtCustom qvtCustom.params batchUstCustom.dat qvtCustom.dat batchUstCustom.sym qvtCustom.sym"

mkdir -p params
cd params

BASE_URL=https://maci-compile.s3.us-east-1.amazonaws.com/params-64
for p in $PKGS
do
  url="$BASE_URL/$p"
  echo "downloading $url"
  curl $url -o $p
done

mv batchUstCustom batchUst32
mv batchUstCustom.r1cs batchUst32.r1cs
mv batchUstCustom.params batchUst32.params
mv qvtCustom qvt32
mv qvtCircuitCustom.r1cs qvtCircuit32.r1cs
mv qvtCustom.params qvt32.params
mv batchUstCustom.dat batchUst32.dat
mv qvtCustom.dat qvt32.dat
mv batchUstCustom.sym batchUst32.sym
mv qvtCustom.sym qvt32.sym
chmod u+x qvt32 batchUst32

