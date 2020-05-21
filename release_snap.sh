#!/bin/bash
git checkout stable
version=$(sed -n -e 's/.*\"version\": \"\(.*\)\".*/\1/p' package.json)
yarn run distsnap
mv dist/Carnet_${version}_amd64.snap dist/carnet_${version}_amd64.snap
snapcraft push --release=stable dist/carnet_${version}_amd64.snap
git checkout master
