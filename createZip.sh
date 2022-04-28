#!/usr/bin/env sh

set -e


yarn build
rm -rf mod
cp -r ./assets/. ./mod
cp perfectCookieMod.js ./mod/main.js
cp perfectCookieMod.ts ./mod/sourceCode.ts
cp info.txt ./mod/info.txt
rm -f mod.zip
zip mod.zip mod -r