#!/bin/sh
# Build the site and publish dist/ to the gh-pages branch (served by GitHub Pages).
# Uses the origin remote, or DEPLOY_REMOTE if set.
set -e
cd "$(dirname "$0")/.."
REMOTE="${DEPLOY_REMOTE:-$(git remote get-url origin)}"
npm run build
cd dist
touch .nojekyll
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -q -f "$REMOTE" gh-pages
rm -rf .git
echo "Deployed to gh-pages"
