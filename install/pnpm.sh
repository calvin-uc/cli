#!/usr/bin/env bash

pnpm_path=$1
pnpm_version=$2
node_bin=$3

# PNPM envs are required for self-installer to work
export PNPM_VERSION=$pnpm_version
export PNPM_DEST=$pnpm_path
export PNPM_REGISTRY=https://urbancompass.jfrog.io/urbancompass/api/npm/npm/
export PNPM_BIN_DEST=$pnpm_path/.dump

## If pnpm path exists then remove it before installing
if [ -d $pnpm_path ]
then
  rm -rf $pnpm_path
fi

echo "Installing pnpm..."
mkdir -p ${pnpm_path}
echo "Downloading pnpm from https://unpkg.com/@pnpm/self-installer"
curl -L https://unpkg.com/@pnpm/self-installer | ${node_bin}
echo "Finished installing pnpm v${pnpm_version}."