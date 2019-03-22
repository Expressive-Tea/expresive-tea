#!/usr/bin/env sh

set -e
export NODE_ENV=development

echo "Waiting for engines to initialize..."
sleep 60
npm run server:dev-webpack
