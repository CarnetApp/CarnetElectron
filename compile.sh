#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage : compile.sh android|electron path"
fi

if [ "$1" == "android" ]; then
    echo "compiling for android"
    mkdir build/
    
    cp reader build/ -R
    mkdir build/compatibility
    cp compatibility/android/* build/compatibility/ -R
    cp compatibility.js build/ -R
    cp browsers build/ -R
    cp libs build/ -R
    cp note build -R
    cp utils build/ -R
    cp img build/ -R
    cp keywords build/ -R
    cp requests build/ -R
    ./node_modules/.bin/babel --presets es2015  build/ -d build/
    cp reader/assets/scripts/Countable.js build/reader/assets/scripts/
    rm "$2"/app/src/main/assets/reader  -R
    cp build "$2"/app/src/main/assets/reader -R
fi
