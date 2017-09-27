#!/bin/bash

# cleanup lib directory
rm -rf lib || exit 0;
mkdir lib;

# build static web site
npm run compile

# cleanup dist directory
rm -rf npm || exit 0;
mkdir npm;

# move compiled files into dist
cd ./lib/src && cp -r ./ ../../npm/

# move to root
cd ../../

# build vanilla package.json
node -e "var package = require('./package.json'); \
  delete package.scripts; \
  delete package.options; \
  package.main = 'index.js'; \
  package.typings = 'index.d.ts'; \
  var fs = require('fs'); \
  fs.writeFileSync('./npm/package.json', JSON.stringify(package, null, 2)); \
  "

# Copy to ./npm
cp README.md npm/
cp LICENSE npm/

# publish to npm
cd npm && npm publish --access public

