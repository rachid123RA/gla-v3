#!/usr/bin/env bash
# Push automatique vers GitHub (commit + push)
# Usage: ./scripts/push-github.sh "message du commit"
#    ou: npm run push:github -- "message du commit"

set -e
cd "$(dirname "$0")/.."

BRANCH="${GIT_BRANCH:-main}"
MSG="${1:-chore: mise à jour automatique MonAppIA}"

echo "==> Branche: $BRANCH"
echo "==> Message: $MSG"

git add -A

if git diff --staged --quiet; then
  echo "==> Aucun changement à committer."
else
  git commit -m "$MSG"
  echo "==> Commit créé."
fi

AHEAD=$(git rev-list --count "origin/$BRANCH"..HEAD 2>/dev/null || echo "1")
if [ "$AHEAD" = "0" ]; then
  echo "==> Déjà à jour sur origin/$BRANCH."
  exit 0
fi

echo "==> Push vers GitHub..."
if [ -n "$GITHUB_TOKEN" ]; then
  # Token dans l'environnement (CI ou export manuel)
  git push "https://${GITHUB_TOKEN}@github.com/rachid123RA/GLA-V2-manar.git" "$BRANCH"
else
  git push origin "$BRANCH"
fi

echo "==> OK — code sur GitHub."
