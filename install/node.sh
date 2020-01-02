#!/usr/bin/env bash

node_path=$1
node_version=$2

## If node path exists then remove it before installing
if [ -d $node_path ]
then
  rm -rf $node_path
fi

platform=
if [[ "$OSTYPE" == "linux-gnu" ]]; then
  platform="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  platform="darwin"
else
  echo "OS Platform $OSTYPE not supported"
  exit 1
fi

echo "Installing node..."
mkdir -p ${node_path}
echo "Downloading node from https://nodejs.org/dist/v${node_version}/node-v${node_version}-${platform}-x64.tar.gz"
curl "https://nodejs.org/dist/v${node_version}/node-v${node_version}-${platform}-x64.tar.gz" | tar xz -C ${node_path} --strip-components=1
echo "Finished installing node v${node_version}."