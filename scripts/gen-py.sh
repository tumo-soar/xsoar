#!/bin/sh
set -eu
pip install -q --no-cache-dir datamodel-code-generator==0.28.5
out=packages/contracts-py/src/xsoar_contracts
find "$out" -name '*.py' ! -name '__init__.py' -delete
for f in contracts/envelope.schema.json contracts/messages/*.schema.json contracts/playbooks/*.schema.json; do
  name=$(basename "$f" .schema.json | tr '.' '_')
  datamodel-codegen --input "$f" --input-file-type jsonschema --output "$out/$name.py" \
    --output-model-type pydantic_v2.BaseModel --target-python-version 3.12 \
    --disable-timestamp --enum-field-as-literal all --use-standard-collections --use-union-operator
done
