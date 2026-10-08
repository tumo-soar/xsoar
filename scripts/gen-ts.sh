#!/bin/sh
set -eu
out=packages/contracts-ts/src
rm -rf "$out"
npx --yes json-schema-to-typescript@15 --no-additionalProperties -i contracts -o "$out"
