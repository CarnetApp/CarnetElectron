#!/bin/bash
git checkout stable
version=$(sed -n -e 's/.*\"version\": \"\(.*\)\".*/\1/p' package.json)
yarn run distdmg
scp dist/Carnet-${version}.dmg phie@qn.phie.ovh:/var/www/html/quicknote/binaries/desktop/daily/
ssh phie@qn.phie.ovh 'cp /var/www/html/quicknote/binaries/desktop/daily/Carnet_${version}.dmg /var/www/html/quicknote/binaries/desktop/currentMac.dmg'
git checkout master
