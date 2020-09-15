#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage : compile.sh android|electron path"
fi

cd i18n
rm tot.json; 
first=true;
echo "{">> tot; 
find . -iname "*.json" |  while read fullfile; 
do 
file=$(cat "$fullfile");
filename=$(basename -- "$fullfile");
$first;
if [ "$first" == "false" ]; 
then 
echo "," >> tot; 

fi;  
first="false"; 
echo "\""${filename%.*}"\":" >> tot; 
echo $file >> tot; 
done
echo "}">> tot; 
mv tot tot.json
cd ..
if [ "$1" == "android" ]; then
    echo "compiling for android"
    rm -R dist/build/
    mkdir dist/build/ -p
    
    cp reader dist/build/ -R
    cp importer dist/build/ -R
    cp exporter dist/build/ -R
    cp fonts dist/build/ -R
    cp compatibility dist/build/ -R
    cp browsers dist/build/ -R
    cp libs dist/build/ -R
    cp utils dist/build/ -R
    cp img dist/build/ -R
    cp css dist/build/ -R
    cp keywords dist/build/ -R
    cp i18n dist/build/ -R
    cp requests dist/build/ -R
    ./node_modules/.bin/babel --presets @babel/preset-env  dist/build/ -d dist/build/
    cp libs/moment.js dist/build/libs/
    cp reader/libs/material-datetime-picker.js dist/build/reader/libs/
    cp reader/libs/rome.standalone.js dist/build/reader/libs/
    cp reader/reminders.js dist/build/reader/
    cp reader/libs/recorder dist/build/reader/libs/ -R

    cp libs/polyfill.js dist/build/libs/

    cp reader/libs/Countable.js dist/build/reader/libs/
    rm "$2"/app/src/main/assets/reader  -R
    cp dist/build "$2"/app/src/main/assets/reader -R
fi
