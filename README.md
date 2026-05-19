# MonAppIA (GollaSense)

Application mobile **Expo / React Native** pour l’aide à la décision agricole (services, support, chatbot, gestion admin) avec une **API Flask** (`gollasense-api`) pour la **prédiction d’irrigation** (modèle ML + génération PDF).

## Architecture (résumé)

- **Frontend** : Expo / React Native (`App.js`, `src/screens/*`)
- **Données locales** : **SQLite** via `expo-sqlite` (`src/services/databaseService.js`)
- **Session** : `AsyncStorage` (clé `currentUserId`)
- **API distante** : Flask (`gollasense-api/app.py`)
- **Abonnements** : `SubscriptionGate` bloque Chatbot / Prédiction si abonnement non **active** (sauf admin)
- **Firebase** : désactivé (migration vers SQLite déjà faite)

## Diagrammes UML (PlantUML)

Les fichiers PlantUML sont dans le dossier `uml/` (contexte, composants, classes, cas d’utilisation, séquences, navigation, activité).

Génération (si PlantUML est installé) :

```bash
plantuml uml/*.puml
```

## Push automatique vers GitHub

**Une seule fois** (authentification Mac) :

```bash
npm run github:setup
```

Puis, à chaque mise à jour :

```bash
npm run push:github -- "feat: description de vos changements"
```

Sans message, un message par défaut est utilisé.

**Avec token** (push sans saisie manuelle) :

```bash
export GITHUB_TOKEN=votre_token_github
npm run push:github -- "feat: ma modification"
```

Dépôt : https://github.com/rachid123RA/GLA-V2-manar

## Prérequis

- Node.js (LTS recommandé)
- npm
- Python 3.9+ (recommandé)
- Expo Go (si test sur téléphone)

## Lancer le projet

### 1) Backend : API Flask (prédiction)

Dans un terminal :

```bash
cd gollasense-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Test rapide :

- `http://127.0.0.1:5001/health`

> Port par défaut : **5001** (modifiable via `PORT` dans l’environnement).

### 2) Frontend : Expo / React Native

Dans un autre terminal (racine du projet) :

```bash
npm install
npm start
```

Commandes utiles :

```bash
npm run android
npm run ios
npm run web
```

Si cache :

```bash
npx expo start -c
```

## Configuration de l’URL de l’API (important)

L’URL de base est gérée par `src/config/api.js` (`getApiBaseUrl()`).

### Téléphone physique (Expo Go)

Sur un vrai téléphone, `localhost` pointe vers le téléphone, pas vers ton PC. Lance Metro avec :

```bash
EXPO_PUBLIC_API_URL=http://IP_DE_TON_PC:5001 npm start
```

- `IP_DE_TON_PC` : IP LAN (même Wi‑Fi que le téléphone).

### Émulateurs (fallback)

- Android émulateur : `http://10.0.2.2:5001`
- iOS simulateur / Web : `http://127.0.0.1:5001`

## Compte admin (démo locale)

Au 1er lancement, si aucun admin n’existe, un admin est seedé dans SQLite :

- **Email** : `admin@monappia.local`
- **Mot de passe** : `admin123`

## Dépannage (rapide)

- **Erreur réseau prédiction** : vérifier que l’API tourne et que `API_URL/health` répond.
- **Sur téléphone** : utiliser `EXPO_PUBLIC_API_URL` avec l’IP du PC + ouvrir le port **5001** (pare-feu).

