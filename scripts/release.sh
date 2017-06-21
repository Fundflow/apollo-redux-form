
#!/bin/bash

# fetch current version
# from https://gist.github.com/DarrenN/8c6a5b969481725a4413
PACKAGE_VERSION=v$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

# cleanup lib directory
rm -rf lib || exit 0;
mkdir lib;

# build static web site
npm run compile

# cleanup dist directory
rm -rf dist || exit 0;
mkdir dist;

# move compiled files into dist
cd ./lib/src && cp -r ./ ../../dist/

# move to root
cd ../../

# build vanilla package.json
node -e "var package = require('./package.json'); \
  delete package.scripts; \
  delete package.options; \
  package.main = 'index.js'; \
  package.typings = 'index.d.ts'; \
  var fs = require('fs'); \
  fs.writeFileSync('./dist/package.json', JSON.stringify(package, null, 2)); \
  "

# Copy to ./npm
cp README.md dist/
cp LICENSE dist/

# move to dist
cd ./dist

# publish content on gh
git init

# create a fake commit
git add .
git commit -m "Create new release"

git config user.name 'New Release Bot'
git config user.email 'bot@noreplay.github.com'

echo "creating release ${PACKAGE_VERSION}"
git push --force --quiet "git@github.com:Fundflow/apollo-redux-form.git" master:$PACKAGE_VERSION > /dev/null 2>&1
