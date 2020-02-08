#!/bin/bash

version=$(sed -n -e 's/.*\"version\": \"\(.*\)\".*/\1/p' package.json)
echo $version > version
git add version
git commit -m "update version number to "+$version
git branch -d stable
git push origin --delete stable
git checkout master
git checkout -b stable
git push origin stable
git checkout -b stable-$version
git push origin stable-$version
git checkout master
