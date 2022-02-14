#!/bin/bash
git checkout stable
git pull --rebase
version=$(sed -n -e 's/.*\"version\": \"\(.*\)\".*/\1/p' package.json)
yarn run distapp
scp dist/Carnet-${version}.AppImage phie@qn.phie.ovh:/var/www/html/quicknote/binaries/desktop/daily/
ssh phie@qn.phie.ovh 'cp /var/www/html/quicknote/binaries/desktop/daily/Carnet-'${version}'.AppImage /var/www/html/quicknote/binaries/desktop/current64.AppImage'
scp dist/Carnet-${version}-i386.AppImage phie@qn.phie.ovh:/var/www/html/quicknote/binaries/desktop/daily/
ssh phie@qn.phie.ovh 'cp /var/www/html/quicknote/binaries/desktop/daily/Carnet-'${version}'-i386.AppImage /var/www/html/quicknote/binaries/desktop/current32.AppImage'

git checkout main
