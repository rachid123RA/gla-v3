@echo off
REM Script pour faciliter les commits et pushes vers GitHub
REM Usage: Double-cliquez sur ce fichier ou exécutez-le depuis PowerShell

echo ========================================
echo   MonAppIA - Push vers GitHub
echo ========================================
echo.

REM Vérifier si Git est initialisé
if not exist ".git" (
    echo [ERREUR] Git n'est pas initialise dans ce dossier.
    echo Veuillez d'abord executer: git init
    pause
    exit /b 1
)

REM Afficher l'état actuel
echo [INFO] Verification de l'etat du depot...
git status
echo.

REM Demander le message de commit
set /p commit_message="Entrez le message de commit (ex: 'Ajout fonctionnalite X'): "

if "%commit_message%"=="" (
    echo [ERREUR] Le message de commit ne peut pas etre vide.
    pause
    exit /b 1
)

echo.
echo [INFO] Ajout des fichiers modifies...
git add .

echo [INFO] Creation du commit...
git commit -m "%commit_message%"

if %errorlevel% neq 0 (
    echo [ERREUR] Echec du commit. Aucun fichier modifie a commiter.
    pause
    exit /b 1
)

echo.
echo [INFO] Envoi vers GitHub...
git push

if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Echec du push. Verifiez:
    echo   - Votre connexion Internet
    echo   - Votre token d'acces personnel (PAT)
    echo   - Que le depot distant est bien configure
    echo.
    echo Pour configurer le depot distant:
    echo   git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
    pause
    exit /b 1
)

echo.
echo ========================================
echo   [SUCCES] Push reussi vers GitHub !
echo ========================================
echo.
pause

