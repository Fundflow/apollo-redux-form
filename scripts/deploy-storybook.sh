#!/bin/bash

# cleanup lib directory
rm -rf storybook-static || exit 0;

# build storybook as static web site
npm run build-storybook || exit 0;

# publish to gh pages

# move to built directory
cd storybook-static || exit 0;

# create git repo
git init

# create a fake commit
git add .
git commit -m "Deploy to GitHub Pages"

git config user.name 'GH Pages Bot'
git config user.email 'mstn@noreplay.github.com'

git push --force --quiet "git@github.com:fundflow/apollo-redux-form.git" master:gh-pages > /dev/null 2>&1

