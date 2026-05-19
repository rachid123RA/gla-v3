#!/usr/bin/env bash
# Configuration une seule fois pour que "git push" fonctionne sur Mac
set -e
cd "$(dirname "$0")/.."

echo "Configuration Git pour GitHub (Mac)..."
git config credential.helper osxkeychain 2>/dev/null || true

echo ""
echo "1) Créez un token: https://github.com/settings/tokens (scope: repo)"
echo "2) Lancez: npm run push:github"
echo "   Login GitHub = votre nom d'utilisateur"
echo "   Password   = le TOKEN (pas le mot de passe du compte)"
echo ""
echo "Option automatique avec token:"
echo "   export GITHUB_TOKEN=votre_token"
echo "   npm run push:github"
echo ""
