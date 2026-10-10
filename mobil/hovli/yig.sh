#!/usr/bin/env bash
# JM Hovli — Android ilovasini yig'ish.
# Kerak: JDK 17, Gradle 8.x, Android SDK 34 (ANDROID_SDK_ROOT o'rnatilgan bo'lsin).
set -euo pipefail
cd "$(dirname "$0")"
: "${ANDROID_SDK_ROOT:?ANDROID_SDK_ROOT o'rnatilmagan}"
echo "sdk.dir=$ANDROID_SDK_ROOT" > local.properties

# Ekranlar front dan olinadi — ilova ichiga kiradi (brauzer yo'q).
A=app/src/main/assets
rm -rf "$A"; mkdir -p "$A/css" "$A/js"
cp ../../front/hovli.html      "$A/"
cp ../../front/css/hovli.css   "$A/css/"
cp ../../front/js/hovli.js     "$A/js/"
cp ../../front/js/jsQR.js      "$A/js/"

gradle --no-daemon assembleRelease -q
mkdir -p ../../chiqish
cp app/build/outputs/apk/release/app-release.apk ../../chiqish/JM-Hovli.apk
ls -lh ../../chiqish/JM-Hovli.apk
