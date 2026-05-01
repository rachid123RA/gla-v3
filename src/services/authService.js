// src/services/authService.js
import { 
  createUser, 
  loginUser, 
  getUserById,
  setCurrentUser,
  getCurrentUser,
  initDatabase,
  ensureSubscriptionForUser
} from './databaseService';

// Initialiser la base de données au démarrage
let dbInitialized = false;

const ensureDatabaseInitialized = async () => {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
};

// Créer un compte utilisateur
export const creerCompte = async (email, password, nom, dateNaissance, imageProfil = null) => {
  try {
    await ensureDatabaseInitialized();
    
    const result = await createUser(email, password, nom, dateNaissance, imageProfil);
    
    if (result.success) {
      // Récupérer les données utilisateur créées
      const userResult = await getUserById(result.userId);
      if (userResult.success) {
        // Créer un abonnement en attente d'activation (demande admin)
        await ensureSubscriptionForUser(result.userId);
        // Sauvegarder l'utilisateur comme utilisateur actuel
        await setCurrentUser(result.userId);
        return { success: true, user: userResult.data };
      }
    }
    
    return result;
  } catch (error) {
    console.error('Erreur création compte:', error);
    return { success: false, error: error.message };
  }
};

// Connexion utilisateur
export const seConnecter = async (email, password) => {
  try {
    await ensureDatabaseInitialized();
    
    const result = await loginUser(email, password);
    
    if (result.success) {
      // Sauvegarder l'utilisateur comme utilisateur actuel
      await setCurrentUser(result.user.id);
    }
    
    return result;
  } catch (error) {
    console.error('Erreur connexion:', error);
    return { success: false, error: error.message };
  }
};

// Déconnexion
export const seDeconnecter = async () => {
  try {
    await setCurrentUser(null);
    return { success: true };
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    return { success: false, error: error.message };
  }
};

// Récupérer les données utilisateur
export const obtenirDonneesUtilisateur = async (userId) => {
  try {
    await ensureDatabaseInitialized();
    return await getUserById(userId);
  } catch (error) {
    console.error('Erreur récupération données:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir l'utilisateur actuellement connecté
export const obtenirUtilisateurActuel = async () => {
  try {
    await ensureDatabaseInitialized();
    return await getCurrentUser();
  } catch (error) {
    console.error('Erreur récupération utilisateur actuel:', error);
    return null;
  }
};