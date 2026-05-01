@echo off
REM Script de configuration initiale pour GitHub
REM Ce script configure Git et connecte le projet à GitHub

echo ========================================
echo   MonAppIA - Configuration GitHub
echo ========================================
echo.

REM Vérifier si Git est installé
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Git n'est pas installe sur votre systeme.
    echo Veuillez installer Git depuis: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [INFO] Git est installe.
echo.

REM Vérifier si Git est déjà initialisé
if exist ".git" (
    echo [INFO] Git est deja initialise dans ce dossier.
    echo.
    set /p continue="Voulez-vous continuer la configuration ? (O/N): "
    if /i not "%continue%"=="O" (
        echo Configuration annulee.
        pause
        exit /b 0
    )
) else (
    echo [INFO] Initialisation de Git...
    git init
    echo [SUCCES] Git initialise.
    echo.
)

REM Configuration de Git (si pas déjà configuré)
echo [INFO] Configuration de Git...
echo.
set /p git_name="Entrez votre nom (pour Git): "
set /p git_email="Entrez votre email (pour Git): "

git config user.name "%git_name%"
git config user.email "%git_email%"

echo.
echo [SUCCES] Git configure avec:
echo   Nom: %git_name%
echo   Email: %git_email%
echo.

REM Ajouter tous les fichiers
echo [INFO] Ajout des fichiers au depot...
git add .

REM Premier commit
echo [INFO] Creation du commit initial...
git commit -m "Initial commit - MonAppIA"

REM Renommer la branche en main
git branch -M main

echo.
echo ========================================
echo   Configuration du Depot GitHub
echo ========================================
echo.
echo Pour connecter ce projet a GitHub, vous devez:
echo.
echo 1. Creer un depot prive sur GitHub:
echo    https://github.com/new
echo.
echo 2. Creer un token d'acces personnel (PAT):
echo    https://github.com/settings/tokens
echo.
echo 3. Executer cette commande (remplacez les valeurs):
echo    git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
echo.
echo 4. Pousser vers GitHub:
echo    git push -u origin main
echo.
echo OU utilisez le script git-push.bat apres avoir configure le remote.
echo.

set /p setup_remote="Voulez-vous configurer le depot distant maintenant ? (O/N): "
if /i "%setup_remote%"=="O" (
    echo.
    set /p github_username="Entrez votre nom d'utilisateur GitHub: "
    set /p repo_name="Entrez le nom du depot GitHub: "
    
    REM Vérifier si le remote existe déjà
    git remote get-url origin >nul 2>&1
    if %errorlevel% equ 0 (
        echo.
        echo [INFO] Un depot distant existe deja.
        set /p replace="Voulez-vous le remplacer ? (O/N): "
        if /i "%replace%"=="O" (
            git remote remove origin
        ) else (
            echo Configuration annulee.
            pause
            exit /b 0
        )
    )
    
    git remote add origin https://github.com/%github_username%/%repo_name%.git
    echo.
    echo [SUCCES] Depot distant configure: https://github.com/%github_username%/%repo_name%.git
    echo.
    echo [INFO] Pour pousser vers GitHub, utilisez:
    echo   git push -u origin main
    echo.
    echo OU utilisez le script git-push.bat
    echo.
    echo [ATTENTION] Vous devrez utiliser votre token d'acces personnel (PAT) comme mot de passe.
    echo.
)

echo ========================================
echo   Configuration terminee !
echo ========================================
echo.
pause

