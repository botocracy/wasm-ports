#!/bin/sh

em++ -I $EMSCRIPTEN/system/include -c -std=c++11 scrypthash.cpp
em++ -I $EMSCRIPTEN/system/include -c -std=c++11 scrypt.cpp
em++ -o scrypt.js scrypthash.o scrypt.o -lcrypto -lssl

node ~/emscripten-module-wrapper/prepare.js scrypt.js --file input.data --file output.data --run --debug --out=dist --upload-ipfs
cp dist/globals.wasm task.wasm
cp dist/info.json .
solc --overwrite --bin --abi --optimize contract.sol -o build

