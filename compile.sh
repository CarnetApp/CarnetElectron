#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage : compile.sh android|electron path"
fi

if [ "$1" == "android" ]; then
    echo "compiling for android"
    cp reader "$2"/app/src/main/assets/reader/ -R
    cp compatibility "$2"/app/src/main/assets/reader/ -R
    cp compatibility.js "$2"/app/src/main/assets/reader/ -R
    cp browsers "$2"/app/src/main/assets/reader/ -R
    cp libs "$2"/app/src/main/assets/reader/ -R
    cp note "$2"/app/src/main/assets/reader -R
fi
