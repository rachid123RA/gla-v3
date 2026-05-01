@echo off
echo ========================================
echo   Demarrage de l'application Expo
echo ========================================
echo.

echo Installation des dependances (si necessaire)...
call npm install

echo.
echo Demarrage de l'application Expo...
echo.
echo Scannez le QR code avec Expo Go sur votre telephone
echo ou utilisez les commandes:
echo   - a : pour Android
echo   - i : pour iOS
echo   - w : pour Web
echo.

npm start

pause


