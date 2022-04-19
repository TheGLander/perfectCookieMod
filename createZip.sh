#!/usr/bin/env sh

yarn tsc
rm -r dist
cp -r ./assets/. ./mod
cp perfectCookieMod.js ./mod/main.js
cp perfectCookieMod.ts ./mod/sourceCode.ts
cp info.txt ./mod/info.txt
rm mod.zip
zip mod.zip mod -r