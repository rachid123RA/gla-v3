#!/usr/bin/env bash
# Enregistre le token GitHub dans .env.local (ignoré par git) — une seule fois
set -e
cd "$(dirname "$0")/.."

if [ -n "$1" ]; then
  TOKEN="$1"
else
  echo "Collez votre token GitHub (classic, scope: repo) — rien ne s'affichera:"
  read -rs TOKEN
  echo ""
fi

TOKEN="$(printf '%s' "$TOKEN" | tr -d '\r\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

if [ -z "$TOKEN" ]; then
  echo "Token vide. Annulé."
  exit 1
fi

if [[ ! "$TOKEN" =~ ^ghp_ ]] && [[ ! "$TOKEN" =~ ^github_pat_ ]]; then
  echo "Attention: le token ne commence pas par ghp_ ou github_pat_."
  echo "Utilisez un Personal Access Token depuis:"
  echo "  https://github.com/settings/tokens"
fi

printf 'GITHUB_TOKEN=%s\n' "$TOKEN" > .env.local
chmod 600 .env.local

echo "==> Test du token..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/user")

if [ "$HTTP_CODE" = "200" ]; then
  echo "Token valide et enregistré dans .env.local"
  echo "Lancez:  npm run push:github"
else
  echo "ERREUR: token refusé par GitHub (HTTP ${HTTP_CODE})."
  echo "Créez un nouveau token (scope repo) puis relancez: npm run github:token"
  rm -f .env.local
  exit 1
fi
