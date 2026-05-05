# GLA-V2-manar (MonAppIA)

Application mobile **React Native / Expo** avec API **Flask** (`gollasense-api`) pour la prédiction d’irrigation. Les comptes et une grande partie des données sont gérés **localement** (SQLite via `expo-sqlite`).

**Dépôt GitHub :** [https://github.com/rachid123RA/GLA-V2-manar](https://github.com/rachid123RA/GLA-V2-manar)

---

## Prérequis

- **Node.js** (LTS recommandé, ex. 18+)
- **npm** ou **yarn**
- **Python** 3.8+
- **Expo Go** sur le téléphone (pour tester sur appareil physique)

---

## Installation (local)

### 1. Cloner le projet

```bash
git clone https://github.com/rachid123RA/GLA-V2-manar.git
cd GLA-V2-manar
```

### 2. Frontend (Expo)

À la racine du dépôt :

```bash
npm install
npm start
```

- **Android (émulateur)** : `npm run android`
- **iOS (simulateur, macOS)** : `npm run ios`
- **Web** : `npm run web`

En cas de souci de cache : `npx expo start -c`

### 3. Backend (API Flask)

Dans un **second terminal** :

```bash
cd gollasense-api
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Par défaut, l’API écoute sur le port **5001** (voir `gollasense-api/app.py`, variable d’environnement `PORT` si besoin).

Test rapide (selon les routes exposées) : ouvrir dans le navigateur `http://localhost:5001` ou une route documentée de votre API.

---

## Configuration de l’URL de l’API (important)

L’URL de base est centralisée dans `src/config/api.js` via `getApiBaseUrl()`.

- **Sans configuration** : simulateur iOS / web → `http://localhost:5001` ; émulateur Android → `http://10.0.2.2:5001`
- **Téléphone physique** : l’appareil ne voit pas `localhost` de votre PC. Définir l’IP locale de votre machine, par exemple :

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.XX:5001 npm start
```

(Remplacez `192.168.1.XX` par l’IPv4 de votre ordinateur, même réseau Wi‑Fi que le téléphone.)

---

## Connexion **admin** (démo locale)

Au premier lancement, si aucun admin n’existe, un compte est créé automatiquement dans SQLite (voir `src/services/databaseService.js`) :

| Champ   | Valeur                 |
|--------|-------------------------|
| Email  | `admin@monappia.local`  |
| Mot de passe | `admin123`      |

**Étapes :**

1. Démarrer l’app (`npm start`), ouvrir dans Expo Go / simulateur.
2. Aller à l’écran de **connexion** (login).
3. Saisir l’email et le mot de passe ci-dessus.
4. Une fois connecté en `admin`, l’onglet / section **Admin** apparaît (dashboard, utilisateurs, abonnements, support).

Les utilisateurs classiques peuvent être en attente d’activation d’abonnement : l’admin les active depuis les écrans d’administration.

> **Sécurité** : ces identifiants sont destinés au **développement local**. Ne les utilisez pas en production sans mécanisme d’auth robuste.

---

## Pousser le projet sur GitHub (rappel)

Si le dépôt existe déjà sur GitHub (repo vide ou avec README) :

```bash
git remote add origin https://github.com/rachid123RA/GLA-V2-manar.git
# ou si origin existe déjà vers une autre URL :
git remote set-url origin https://github.com/rachid123RA/GLA-V2-manar.git

git branch -M main
git push -u origin main
```

Authentification : GitHub peut exiger un **Personal Access Token** (HTTPS) ou une clé SSH (`git@github.com:...`).

---

## Dépannage

- **`Module not found`** : supprimer `node_modules`, relancer `npm install`.
- **Prédiction / API** : vérifier que Flask tourne, le port (**5001** par défaut) et `EXPO_PUBLIC_API_URL` sur téléphone physique.
- **Pare-feu** : autoriser le port de l’API sur votre machine pour les tests en réseau local.

---

## Structure du dépôt (aperçu)

```
├── src/                 # Écrans, services, config (dont api.js)
├── gollasense-api/      # API Flask + modèle ML
├── assets/
└── package.json
```

Bon développement.
