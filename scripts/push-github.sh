#!/usr/bin/env bash
# Push automatique vers GitHub (commit + push)
# Usage: ./scripts/push-github.sh "message du commit"
#    ou: npm run push:github -- "message du commit"

set -e
cd "$(dirname "$0")/.."

# Token automatique : .env.local (une seule config) ou variable d'environnement
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
fi

BRANCH="${GIT_BRANCH:-main}"
MSG="${1:-chore: mise à jour automatique MonAppIA}"
REPO="rachid123RA/GLA-V2-manar"

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
if [ -z "$GITHUB_TOKEN" ]; then
  echo ""
  echo "ERREUR: pas de token GitHub."
  echo "Lancez UNE FOIS:  npm run github:token"
  echo "Puis:             npm run push:github"
  echo ""
  exit 1
fi

git push "https://${GITHUB_TOKEN}@github.com/${REPO}.git" "$BRANCH"

echo "==> OK — code sur GitHub: https://github.com/${REPO}"
