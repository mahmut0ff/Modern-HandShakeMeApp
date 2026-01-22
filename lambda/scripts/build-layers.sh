#!/bin/bash

# Build Lambda layers

set -e

echo "Building Lambda layers..."

# Create dist directory
mkdir -p dist/layers

# Build common layer
echo "Building common layer..."
mkdir -p dist/layers/common/nodejs/node_modules
cp -r lambda/shared/utils dist/layers/common/nodejs/node_modules/
cp -r lambda/shared/types dist/layers/common/nodejs/node_modules/
cp -r lambda/shared/cache dist/layers/common/nodejs/node_modules/
cp -r lambda/shared/events dist/layers/common/nodejs/node_modules/
cd dist/layers/common && zip -r ../common.zip . && cd ../../..

# Build database layer
echo "Building database layer..."
mkdir -p dist/layers/database/nodejs/node_modules
cp -r lambda/shared/db dist/layers/database/nodejs/node_modules/
cp -r node_modules/@prisma dist/layers/database/nodejs/node_modules/
cp -r node_modules/.prisma dist/layers/database/nodejs/node_modules/
cd dist/layers/database && zip -r ../database.zip . && cd ../../..

# Build middleware layer
echo "Building middleware layer..."
mkdir -p dist/layers/middleware/nodejs/node_modules
cp -r lambda/shared/middleware dist/layers/middleware/nodejs/node_modules/
cd dist/layers/middleware && zip -r ../middleware.zip . && cd ../../..

# Build AWS SDK layer
echo "Building AWS SDK layer..."
mkdir -p dist/layers/aws-sdk/nodejs/node_modules
cp -r node_modules/@aws-sdk dist/layers/aws-sdk/nodejs/node_modules/
cd dist/layers/aws-sdk && zip -r ../aws-sdk.zip . && cd ../../..

echo "Lambda layers built successfully!"
