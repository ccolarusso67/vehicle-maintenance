#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"
cd /Users/carminecolarusso/Desktop/Claude/vehicle-maintenance
npx next dev
