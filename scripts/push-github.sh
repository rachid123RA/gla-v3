#!/usr/bin/env bash
# Push automatique vers GitHub (commit + push)
# Usage: ./scripts/push-github.sh "message du commit"
#    ou: npm run push:github -- "message du commit"

set -e
cd "$(dirname "$0")/.."

# Token : .env.local (npm run github:token) ou variable d'environnement
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
fi

# Nettoyer le token (espaces, guillemets, retours ligne)
GITHUB_TOKEN="$(printf '%s' "${GITHUB_TOKEN:-}" | tr -d '\r\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"

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

AHEAD=$(git rev-list --count "origin/${BRANCH}"..HEAD 2>/dev/null || echo "1")
if [ "$AHEAD" = "0" ]; then
  echo "==> Déjà à jour sur origin/${BRANCH}."
  exit 0
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo ""
  echo "ERREUR: aucun token GitHub."
  echo "  npm run github:token   # enregistrer un token valide"
  echo "  npm run push:github"
  echo ""
  exit 1
fi

echo "==> Vérification du token GitHub..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/user")

if [ "$HTTP_CODE" != "200" ]; then
  echo ""
  echo "ERREUR: token GitHub invalide ou expiré (HTTP ${HTTP_CODE})."
  echo "  1) Créez un nouveau token: https://github.com/settings/tokens"
  echo "     (classic) cochez au minimum: repo"
  echo "  2) Réenregistrez-le:"
  echo "     npm run github:token"
  echo "  3) Relancez:"
  echo "     npm run push:github"
  echo ""
  exit 1
fi

echo "==> Token OK. Push vers GitHub (${AHEAD} commit(s))..."

export GIT_TERMINAL_PROMPT=0
PUSH_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git"

if ! git -c credential.helper= push "$PUSH_URL" "$BRANCH"; then
  echo ""
  echo "ERREUR: le push a échoué. Vérifiez le token (scope repo) et votre connexion internet."
  exit 1
fi

echo "==> OK — code sur GitHub: https://github.com/${REPO}"
