#!/usr/bin/env bash
# Installation complète : venv Python + pip + npm (racine)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Rendre Node/npm visibles quand ils ne sont pas dans le PATH du script
# (nvm/fnm non chargés, ou Node uniquement dans Conda/Homebrew)
ensure_node_on_path() {
  if command -v node >/dev/null 2>&1; then
    return 0
  fi
  if [ -n "${CONDA_PREFIX:-}" ] && [ -x "${CONDA_PREFIX}/bin/node" ]; then
    export PATH="${CONDA_PREFIX}/bin:${PATH}"
    return 0
  fi
  for d in /opt/homebrew/bin /usr/local/bin; do
    if [ -x "${d}/node" ]; then
      export PATH="${d}:${PATH}"
      return 0
    fi
  done
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
  fi
  if command -v node >/dev/null 2>&1; then
    return 0
  fi
  if command -v fnm >/dev/null 2>&1; then
    eval "$(fnm env --shell bash 2>/dev/null || fnm env)"
  fi
  command -v node >/dev/null 2>&1
}

echo "=========================================="
echo "  MonAppIA — installation automatique"
echo "=========================================="
echo ""

if ! ensure_node_on_path; then
  echo "Erreur : Node.js introuvable dans le PATH."
  echo "  Option A — Conda (vous êtes en base) :"
  echo "    conda install -c conda-forge nodejs"
  echo "  Option B — Installateur officiel : https://nodejs.org/ (LTS 18+ pour Expo 54)"
  echo "  Option C — nvm : curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
  echo "             puis fermez/rouvrez le terminal, : nvm install --lts"
  exit 1
fi
NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
if [ "${NODE_MAJOR:-0}" -lt 18 ] 2>/dev/null; then
  echo "Attention : Expo SDK 54 fonctionne mieux avec Node.js 18+ (actuel : $(node -v))."
fi

# numpy 2.1 / pandas 2.2.3 exigent Python >= 3.10 (le README « 3.8+ » est obsolète pour ce requirements.txt)
PYTHON_CMD=""
for try in python3.12 python3.11 python3.10; do
  if command -v "$try" >/dev/null 2>&1; then
    if "$try" -c 'import sys; assert sys.version_info >= (3, 10)' 2>/dev/null; then
      PYTHON_CMD="$try"
      break
    fi
  fi
done
if [ -z "$PYTHON_CMD" ] && command -v python3 >/dev/null 2>&1; then
  if python3 -c 'import sys; assert sys.version_info >= (3, 10)' 2>/dev/null; then
    PYTHON_CMD="python3"
  fi
fi
if [ -z "$PYTHON_CMD" ]; then
  echo "Erreur : il faut Python 3.10 ou plus pour ce backend (numpy 2.x, pandas 2.2.x)."
  echo "  macOS : brew install python@3.11"
  echo "  Puis relancez : ./setup-all.sh"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Erreur : npm introuvable. Réinstallez Node.js LTS (inclut npm) : https://nodejs.org/"
  echo "  Si vous utilisez nvm, ouvrez un terminal interactif où nvm est chargé, puis : ./setup-all.sh"
  exit 1
fi

echo "Python : $($PYTHON_CMD --version) ($PYTHON_CMD)"
echo "Node   : $(node --version)"
echo "npm    : $(npm --version)"
echo ""

echo "[1/2] Backend Flask (venv + pip) — gollasense-api"
cd "$ROOT/gollasense-api"
if [ ! -d "venv" ]; then
  echo "  Création du venv..."
  "$PYTHON_CMD" -m venv venv
fi
# shellcheck source=/dev/null
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd "$ROOT"

echo ""
echo "[2/2] Frontend Expo — npm install à la racine"
npm install

echo ""
echo "=========================================="
echo "  Installation terminée."
echo "=========================================="
echo ""
echo "Lancer le projet (2 terminaux) :"
echo "  1) API :    cd \"$ROOT\" && ./start-api.sh"
echo "  2) Expo :   cd \"$ROOT\" && npm start"
echo ""
echo "Téléphone physique : mettez votre IP dans src/screens/PredictionScreen.js (const API_URL)."
echo ""
