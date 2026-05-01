@echo off
echo ========================================
echo   Demarrage de l'API Flask
echo ========================================
echo.

cd gollasense-api

echo Activation de l'environnement virtuel...
call venv\Scripts\activate.bat

echo.
echo Installation des dependances (si necessaire)...
pip install -r requirements.txt

echo.
echo Demarrage du serveur Flask...
echo L'API sera accessible sur http://localhost:5000
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

python app.py

pause


