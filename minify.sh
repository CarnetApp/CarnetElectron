#!/bin/bash
mkdir minified
files=`sed -n -e 's/.*script.*src.*"\(.*\)\".*/\1/p' index.html | grep -v jquery | grep -v  /browser.js | grep -v search.js | grep -v browsers/browser.depedencies.min.js` 
rm minified/browser.depedencies.min.js
touch minified/browser.depedencies.min.js
terser $files -o minified/browser.depedencies.min.js
sed  "s/startjs-->//g" index.html -i
sed  "s/<\!--endjs//g" index.html -i
sed  "s/<\!--startmin//g" index.html -i
sed  "s/endmin-->//g" index.html -i

files=`sed -n -e 's/.*script.*src.*"\(.*\)\".*/\1/p' reader/reader.html | grep -v jquery.min.js | grep -v  /browser.js | grep -v reader/reader.min.js | sed "s/<\!ROOTPATH>//g"`
rm minified/reader.min.js
touch minified/reader.min.js
terser $files -o minified/reader.min.js
sed  "s/startjs-->//g" reader/reader.html -i
sed  "s/<\!--endjs//g" reader/reader.html -i
sed  "s/<\!--startmin//g" reader/reader.html -i
sed  "s/endmin-->//g" reader/reader.html -i
