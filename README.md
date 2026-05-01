# Guide de Démarrage - MonAppIA

## 📋 Prérequis

- **Node.js** (version 14 ou supérieure)
- **npm** ou **yarn**
- **Python** (version 3.8 ou supérieure)
- **Expo CLI** (installé globalement ou via npx)
- **Expo Go** sur votre téléphone (pour tester sur mobile)

## 🚀 Démarrage de l'Application

### Étape 1 : Installer les dépendances de l'application React Native

```bash
# Depuis le répertoire racine du projet
npm install
```

ou si vous utilisez yarn :

```bash
yarn install
```

### Étape 2 : Démarrer l'API Flask (Backend)

Ouvrez un **premier terminal** et exécutez :

```bash
# Naviguer vers le dossier de l'API
cd gollasense-api

# Activer l'environnement virtuel (si vous utilisez venv)
# Sur Windows :
venv\Scripts\activate

# Sur macOS/Linux :
source venv/bin/activate

# Installer les dépendances Python (si pas déjà fait)
pip install -r requirements.txt

# Démarrer le serveur Flask
python app.py
```

L'API sera accessible sur : **http://localhost:5000**

> ⚠️ **Important** : Gardez ce terminal ouvert pour que l'API continue de fonctionner.

### Étape 3 : Démarrer l'application Expo (Frontend)

Ouvrez un **deuxième terminal** (nouveau) et exécutez :

```bash
# Depuis le répertoire racine du projet
npm start
```

ou

```bash
expo start
```

Cela ouvrira le **Metro Bundler** dans votre navigateur avec un QR code.

### Étape 4 : Lancer l'application sur votre appareil

Vous avez plusieurs options :

#### Option A : Sur votre téléphone (recommandé pour tester)

1. Installez **Expo Go** depuis :
   - [App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scannez le QR code affiché dans le terminal ou le navigateur
3. L'application se chargera sur votre téléphone

#### Option B : Sur un émulateur/simulateur

**Pour Android :**
```bash
npm run android
```

**Pour iOS (macOS seulement) :**
```bash
npm run ios
```

**Pour le Web :**
```bash
npm run web
```

## ⚙️ Configuration

### Configuration de l'URL de l'API

Si votre API Flask est sur une autre adresse (par exemple, si vous testez sur un téléphone physique), vous devez modifier l'URL dans :

**Fichier : `src/screens/PredictionScreen.js`**

```javascript
// Ligne ~28, modifiez cette ligne :
const API_URL = 'http://localhost:5000'; // Pour émulateur

// Pour téléphone physique, utilisez votre IP locale :
const API_URL = 'http://192.168.1.XXX:5000'; // Remplacez XXX par votre IP
```

Pour trouver votre IP locale :
- **Windows** : Ouvrez PowerShell et tapez `ipconfig`, cherchez "IPv4 Address"
- **macOS/Linux** : Ouvrez Terminal et tapez `ifconfig` ou `ip addr`

### Ports utilisés

- **Expo/Metro Bundler** : Port 8081 (par défaut)
- **API Flask** : Port 5000 (par défaut)

Assurez-vous que ces ports ne sont pas utilisés par d'autres applications.

## 🔧 Dépannage

### Problème : "Module not found"

**Solution :**
```bash
# Supprimez node_modules et réinstallez
rm -rf node_modules
npm install
```

### Problème : L'API ne répond pas

**Vérifications :**
1. Vérifiez que l'API Flask est bien démarrée (terminal 1)
2. Vérifiez que le port 5000 n'est pas utilisé
3. Testez l'API dans votre navigateur : `http://localhost:5000/get-options`

### Problème : L'application ne se connecte pas à l'API

**Solutions :**
1. Si vous êtes sur téléphone physique, utilisez votre IP locale au lieu de `localhost`
2. Vérifiez que votre téléphone et votre ordinateur sont sur le même réseau Wi-Fi
3. Vérifiez les permissions du pare-feu Windows

### Problème : Erreur "expo-sqlite" ou autres modules natifs

**Solution :**
```bash
# Nettoyez le cache Expo
expo start -c
```

## 📱 Structure du Projet

```
MonAppIA P1/
├── src/
│   ├── screens/          # Écrans de l'application
│   ├── services/         # Services (auth, database)
│   └── config/           # Configuration
├── gollasense-api/       # API Flask pour les prédictions
│   ├── app.py           # Serveur Flask principal
│   ├── model/            # Modèle ML
│   └── utils/            # Utilitaires
├── assets/               # Images et ressources
└── package.json          # Dépendances Node.js
```

## 🎯 Fonctionnalités

- ✅ **Authentification** : Création de compte et connexion avec SQLite
- ✅ **Gestion de Profil** : Photo de profil utilisateur
- ✅ **Gestion de Stock** : Ajout, modification, suppression de stocks agricoles
- ✅ **Prédiction d'Irrigation** : Prédiction de la quantité d'eau nécessaire
- ✅ **Stockage Local** : Toutes les données sont stockées localement avec SQLite

## 📝 Notes importantes

1. **L'API Flask doit être démarrée avant l'application** pour que la fonctionnalité de prédiction fonctionne
2. **Pour tester sur un téléphone physique**, assurez-vous que votre téléphone et votre ordinateur sont sur le même réseau Wi-Fi
3. **Les données sont stockées localement** dans SQLite, donc elles persistent même après la fermeture de l'application

## 🆘 Support

Si vous rencontrez des problèmes, vérifiez :
- Les logs dans les terminaux (API et Expo)
- La console du navigateur (si vous utilisez le web)
- Les logs dans Expo Go sur votre téléphone

---

**Bon développement ! 🚀**


