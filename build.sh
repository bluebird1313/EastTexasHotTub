#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Building project..."
npx tsc

echo "Build completed successfully!" 