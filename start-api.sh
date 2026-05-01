#!/bin/bash

echo "========================================"
echo "  Démarrage de l'API Flask"
echo "========================================"
echo ""

cd gollasense-api

PYTHON_CMD=""
for try in python3.12 python3.11 python3.10; do
  if command -v "$try" >/dev/null 2>&1 && "$try" -c 'import sys; assert sys.version_info >= (3, 10)' 2>/dev/null; then
    PYTHON_CMD="$try"
    break
  fi
done
if [ -z "$PYTHON_CMD" ] && command -v python3 >/dev/null 2>&1 && python3 -c 'import sys; assert sys.version_info >= (3, 10)' 2>/dev/null; then
  PYTHON_CMD="python3"
fi
if [ -z "$PYTHON_CMD" ]; then
  echo "Python 3.10+ requis pour l'API. Installez : brew install python@3.11"
  exit 1
fi

if [ ! -d "venv" ]; then
  echo "Environnement virtuel absent — création ($PYTHON_CMD -m venv venv)..."
  "$PYTHON_CMD" -m venv venv
fi

echo "Activation de l'environnement virtuel..."
source venv/bin/activate

echo ""
echo "Installation des dépendances (si nécessaire)..."
pip install -r requirements.txt

echo ""
echo "Démarrage du serveur Flask..."
echo "L'API sera accessible sur http://localhost:5000"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

python app.py


