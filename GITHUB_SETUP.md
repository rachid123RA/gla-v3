# 🚀 Guide de Configuration GitHub - MonAppIA

Ce guide vous explique comment configurer votre projet sur GitHub en tant que dépôt privé et comment effectuer des mises à jour automatiques.

## 📋 Informations Nécessaires pour GitHub

Pour configurer GitHub, vous aurez besoin de :

1. **Compte GitHub** : Un compte GitHub (gratuit suffit)
2. **Nom du dépôt** : Le nom que vous voulez donner à votre projet (ex: `MonAppIA`)
3. **Token d'accès personnel (PAT)** : Pour authentifier vos pushes vers GitHub

---

## 🔐 Étape 1 : Créer un Token d'Accès Personnel (PAT)

1. Allez sur GitHub : https://github.com
2. Connectez-vous à votre compte
3. Cliquez sur votre photo de profil (en haut à droite)
4. Allez dans **Settings** (Paramètres)
5. Dans le menu de gauche, cliquez sur **Developer settings**
6. Cliquez sur **Personal access tokens** → **Tokens (classic)**
7. Cliquez sur **Generate new token** → **Generate new token (classic)**
8. Donnez un nom à votre token (ex: "MonAppIA Project")
9. Sélectionnez les permissions :
   - ✅ **repo** (toutes les cases cochées) - pour gérer les dépôts
   - ✅ **workflow** - si vous voulez utiliser GitHub Actions plus tard
10. Cliquez sur **Generate token**
11. **⚠️ IMPORTANT** : Copiez le token immédiatement (vous ne pourrez plus le voir après) et gardez-le dans un endroit sûr

---

## 📦 Étape 2 : Créer un Dépôt Privé sur GitHub

1. Allez sur https://github.com/new
2. Remplissez les informations :
   - **Repository name** : `MonAppIA` (ou le nom que vous préférez)
   - **Description** : "Application IA pour la gestion agricole"
   - **Visibilité** : Sélectionnez **Private** (Privé) ⭐
   - **NE COCHEZ PAS** "Add a README file" (on a déjà un README)
   - **NE COCHEZ PAS** "Add .gitignore" (on a déjà un .gitignore)
   - **NE COCHEZ PAS** "Choose a license"
3. Cliquez sur **Create repository**

---

## 🔗 Étape 3 : Connecter Votre Projet Local à GitHub

### Option A : Configuration Automatique (Recommandé)

Exécutez simplement le script `setup-github.bat` qui va tout configurer pour vous.

### Option B : Configuration Manuelle

Ouvrez PowerShell dans le dossier du projet et exécutez :

```powershell
# 1. Vérifier que Git est configuré
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"

# 2. Ajouter tous les fichiers au dépôt
git add .

# 3. Faire le premier commit
git commit -m "Initial commit - MonAppIA"

# 4. Renommer la branche en 'main' (si nécessaire)
git branch -M main

# 5. Ajouter le dépôt distant GitHub
# Remplacez VOTRE_USERNAME et VOTRE_REPO par vos informations
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git

# 6. Pousser vers GitHub (vous devrez entrer votre token comme mot de passe)
git push -u origin main
```

**Note** : Quand GitHub vous demande votre mot de passe, utilisez votre **token d'accès personnel** (PAT) que vous avez créé à l'étape 1.

---

## 👥 Étape 4 : Ajouter des Collaborateurs (Optionnel)

Si vous voulez donner accès à d'autres personnes :

1. Allez sur votre dépôt GitHub
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Collaborators**
4. Cliquez sur **Add people**
5. Entrez le nom d'utilisateur GitHub ou l'email de la personne
6. Cliquez sur **Add [nom] to this repository**
7. La personne recevra une invitation par email

---

## 🔄 Étape 5 : Effectuer des Mises à Jour (Commits et Pushes)

### Méthode 1 : Utiliser le Script Automatique (Recommandé)

Exécutez simplement `git-push.bat` après chaque modification. Le script va :
- Ajouter tous les fichiers modifiés
- Créer un commit avec un message descriptif
- Pousser vers GitHub

### Méthode 2 : Commandes Manuelles

```powershell
# 1. Voir les fichiers modifiés
git status

# 2. Ajouter les fichiers modifiés
git add .

# 3. Créer un commit avec un message descriptif
git commit -m "Description de vos modifications"

# 4. Pousser vers GitHub
git push
```

### Exemples de Messages de Commit

- `"Ajout de la fonctionnalité de prédiction d'irrigation"`
- `"Correction du bug dans l'authentification"`
- `"Mise à jour de l'interface utilisateur"`
- `"Ajout de nouveaux capteurs"`
- `"Optimisation des performances"`

---

## 📜 Étape 6 : Voir l'Historique et Revenir à une Version Précédente

### Voir l'Historique des Commits

```powershell
git log --oneline
```

Cela affichera tous les commits avec leurs messages.

### Revenir à une Version Précédente

#### Option A : Voir une Version Précédente (sans modifier)

```powershell
# Voir les détails d'un commit spécifique
git show COMMIT_ID

# Voir les fichiers d'un commit spécifique
git checkout COMMIT_ID -- .
```

#### Option B : Créer une Nouvelle Branche à partir d'une Version Précédente

```powershell
# Créer une branche à partir d'un commit spécifique
git checkout -b nom-de-la-branche COMMIT_ID
```

#### Option C : Revenir Complètement à une Version Précédente

```powershell
# ⚠️ ATTENTION : Cela supprimera les modifications non commitées
git reset --hard COMMIT_ID
```

**Recommandation** : Utilisez plutôt les branches pour tester des versions précédentes sans perdre votre travail actuel.

---

## 🔍 Vérifier l'État du Dépôt

```powershell
# Voir les fichiers modifiés
git status

# Voir les différences
git diff

# Voir l'historique
git log --oneline --graph
```

---

## 🆘 Dépannage

### Problème : "remote origin already exists"

**Solution** :
```powershell
git remote remove origin
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
```

### Problème : "Authentication failed"

**Solution** : Vérifiez que vous utilisez bien votre token d'accès personnel (PAT) et non votre mot de passe GitHub.

### Problème : "Permission denied"

**Solution** : Vérifiez que votre token a bien les permissions `repo` activées.

### Problème : "Updates were rejected"

**Solution** :
```powershell
git pull origin main --rebase
git push
```

---

## 📝 Bonnes Pratiques

1. **Faites des commits réguliers** : Ne laissez pas passer trop de temps entre les commits
2. **Messages de commit clairs** : Décrivez clairement ce que vous avez modifié
3. **Ne commitez pas de fichiers sensibles** : Vérifiez que les clés API, tokens, etc. sont dans `.gitignore`
4. **Testez avant de pusher** : Assurez-vous que votre code fonctionne avant de le pousser
5. **Utilisez des branches** : Pour tester de nouvelles fonctionnalités sans affecter la version principale

---

## ✅ Checklist de Configuration

- [ ] Compte GitHub créé
- [ ] Token d'accès personnel (PAT) créé et sauvegardé
- [ ] Dépôt privé créé sur GitHub
- [ ] Projet local connecté à GitHub
- [ ] Premier commit effectué
- [ ] Premier push réussi
- [ ] Collaborateurs ajoutés (si nécessaire)

---

**🎉 Félicitations ! Votre projet est maintenant sur GitHub et privé !**

