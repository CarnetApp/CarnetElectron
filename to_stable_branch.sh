#!/bin/bash

version=$(sed -n -e 's/.*\"version\": \"\(.*\)\".*/\1/p' package.json)
echo $version > version
git add version
git commit -m "update version number to "+$version
git branch -D stable
git push origin --delete stable
git push framagit --delete stable
git checkout main
git checkout -b stable
git push origin stable
git push framagit stable
git checkout -b stable-$version
git push origin stable-$version
git push framagit stable-$version
git checkout main
git push

