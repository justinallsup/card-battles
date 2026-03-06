#!/bin/bash
set -e
REPO_NAME="card-battles"
DESCRIPTION="⚔️ The ultimate sports card battle platform"
echo "Setting up GitHub repository..."
if ! command -v gh &> /dev/null; then
  echo "Install GitHub CLI: https://cli.github.com/"
  exit 1
fi
gh repo create "$REPO_NAME" \
  --description "$DESCRIPTION" \
  --public \
  --source=. \
  --remote=origin \
  --push
echo ""
echo "✅ Repo created and pushed!"
echo "   https://github.com/$(gh api user -q .login)/$REPO_NAME"
