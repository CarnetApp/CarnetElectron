#!/bin/bash
path="/home/ovh2/quicknote"
git checkout stable
git pull --rebase
version=$(sed -n -e 's/.*\"version\": \"\(.*\)\".*/\1/p' package.json)
yarn run distapp
scp version phie@qn.phie.ovh:${path}/binaries/desktop/daily/
scp dist/Carnet-${version}.AppImage phie@qn.phie.ovh:${path}/binaries/desktop/daily/
ssh phie@qn.phie.ovh 'cp "${path}"binaries/desktop/daily/Carnet-'${version}'.AppImage '${path}'/binaries/desktop/current64.AppImage'
scp dist/Carnet-${version}-i386.AppImage phie@qn.phie.ovh:"${path}"binaries/desktop/daily/
ssh phie@qn.phie.ovh 'cp "${path}"binaries/desktop/daily/Carnet-'${version}'-i386.AppImage '${path}'/binaries/desktop/current32.AppImage'

git checkout main
