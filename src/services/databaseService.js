// src/services/databaseService.js
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let db = null;

// Initialiser la base de données
export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync('MonAppIA.db');
    
    // Créer la table des utilisateurs
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nom TEXT NOT NULL,
        dateNaissance TEXT,
        imageProfil TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        createdAt TEXT DEFAULT (datetime('now'))
      );
    `);

    // Migration: ajouter "role" si la table existait déjà sans la colonne
    try {
      await db.execAsync(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';`);
    } catch (e) {
      // Ignore: colonne déjà existante
    }
    
    // Créer la table des stocks
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS stocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        typeProduit TEXT NOT NULL,
        quantite INTEGER NOT NULL,
        dateEntree TEXT NOT NULL,
        dateSortie TEXT,
        budget REAL,
        zoneAgricole TEXT,
        description TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      );
    `);

    // Table: prédictions (pour stats admin)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE SET NULL
      );
    `);

    // Table: abonnements (MVP)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        plan TEXT NOT NULL DEFAULT 'free',
        status TEXT NOT NULL DEFAULT 'pending',
        startsAt TEXT DEFAULT (datetime('now')),
        endsAt TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // Table: FAQ chatbot (données locales Q/R)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS chatbot_faq (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        tags TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
      );
    `);

    // Table: tickets support
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE SET NULL
      );
    `);

    // Seed FAQ (si vide)
    const faqCount = await db.getFirstAsync(`SELECT COUNT(*) as c FROM chatbot_faq`);
    if ((faqCount?.c ?? 0) === 0) {
      const faqs = [
        {
          q: "Comment activer mon compte ?",
          a: "Votre compte est d’abord en attente. Appuyez sur « Demander activation » puis l’admin active votre abonnement (mensuel/annuel).",
          tags: "activation,abonnement,admin",
        },
        {
          q: "Pourquoi la prédiction ne marche pas ?",
          a: "Vérifiez que l’API Flask est démarrée, que l’URL API est correcte (IP du PC sur téléphone) et que le port est autorisé (souvent 5001).",
          tags: "prediction,api,flask,erreur",
        },
        {
          q: "Comment faire une prédiction d’irrigation ?",
          a: "Allez dans « Prédiction », choisissez la plante, la saison, le sol, l’état, puis saisissez surface et âge. Ensuite appuyez sur « Calculer ». ",
          tags: "prediction,irrigation",
        },
        {
          q: "Comment ajouter un stock ?",
          a: "Ouvrez « Stock », puis ajoutez le produit (type, quantité, date, budget, zone). Vous pouvez ensuite modifier ou supprimer un stock.",
          tags: "stock,gestion",
        },
        {
          q: "C’est quoi le rôle admin ?",
          a: "L’admin gère les utilisateurs, active les abonnements et consulte les statistiques globales (comptes, prédictions, abonnements).",
          tags: "admin,roles",
        },
      ];
      for (const f of faqs) {
        // eslint-disable-next-line no-await-in-loop
        await db.runAsync(
          `INSERT INTO chatbot_faq (question, answer, tags) VALUES (?, ?, ?)`,
          [f.q, f.a, f.tags]
        );
      }
    }

    // Seed: créer un admin par défaut si absent
    // (local demo) email: admin@monappia.local / mdp: admin123
    const existingAdmin = await db.getFirstAsync(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    );
    if (!existingAdmin) {
      try {
        await db.runAsync(
          `INSERT INTO users (email, password, nom, dateNaissance, imageProfil, role)
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['admin@monappia.local', 'admin123', 'ADMIN', null, null, 'admin']
        );
      } catch (e) {
        // Ignore si déjà créé
      }
    }
    
    console.log('Base de données initialisée avec succès');
    return { success: true };
  } catch (error) {
    console.error('Erreur initialisation base de données:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir l'instance de la base de données
export const getDatabase = async () => {
  if (!db) {
    await initDatabase();
  }
  return db;
};

// Créer un utilisateur
export const createUser = async (email, password, nom, dateNaissance, imageProfil = null, role = 'user') => {
  try {
    const database = await getDatabase();
    
    // Vérifier si l'email existe déjà
    const existingUser = await database.getFirstAsync(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUser) {
      return { success: false, error: 'Cet email est déjà utilisé' };
    }
    
    // Insérer le nouvel utilisateur
    const result = await database.runAsync(
      `INSERT INTO users (email, password, nom, dateNaissance, imageProfil, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, password, nom, dateNaissance || null, imageProfil || null, role]
    );
    
    return { 
      success: true, 
      userId: result.lastInsertRowId 
    };
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    return { success: false, error: error.message };
  }
};

// Vérifier les identifiants de connexion
export const loginUser = async (email, password) => {
  try {
    const database = await getDatabase();
    
    const user = await database.getFirstAsync(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    
    if (user) {
      // Retirer le mot de passe de la réponse
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } else {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }
  } catch (error) {
    console.error('Erreur connexion:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir les données d'un utilisateur par ID
export const getUserById = async (userId) => {
  try {
    const database = await getDatabase();
    
    const user = await database.getFirstAsync(
      'SELECT id, email, nom, dateNaissance, imageProfil, role, createdAt FROM users WHERE id = ?',
      [userId]
    );
    
    if (user) {
      return { success: true, data: user };
    } else {
      return { success: false, error: 'Utilisateur non trouvé' };
    }
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return { success: false, error: error.message };
  }
};

// Enregistrer une prédiction pour stats
export const recordPrediction = async (userId) => {
  try {
    const database = await getDatabase();
    await database.runAsync('INSERT INTO predictions (userId) VALUES (?)', [userId ?? null]);
    return { success: true };
  } catch (error) {
    console.error('Erreur recordPrediction:', error);
    return { success: false, error: error.message };
  }
};

// ========== ADMIN ==========
export const getAdminMetrics = async () => {
  try {
    const database = await getDatabase();
    const totalUsersRow = await database.getFirstAsync('SELECT COUNT(*) as c FROM users');
    const totalPredRow = await database.getFirstAsync('SELECT COUNT(*) as c FROM predictions');
    const usersPredRow = await database.getFirstAsync(
      'SELECT COUNT(DISTINCT userId) as c FROM predictions WHERE userId IS NOT NULL'
    );
    const subsRow = await database.getFirstAsync('SELECT COUNT(*) as c FROM subscriptions');
    return {
      success: true,
      data: {
        totalUsers: totalUsersRow?.c ?? 0,
        totalPredictions: totalPredRow?.c ?? 0,
        usersWithPredictions: usersPredRow?.c ?? 0,
        totalSubscriptions: subsRow?.c ?? 0,
      },
    };
  } catch (error) {
    console.error('Erreur getAdminMetrics:', error);
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    const database = await getDatabase();
    const users = await database.getAllAsync(
      'SELECT id, email, nom, dateNaissance, imageProfil, role, createdAt FROM users ORDER BY createdAt DESC'
    );
    return { success: true, data: users };
  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    return { success: false, error: error.message };
  }
};

export const setUserRole = async (userId, role) => {
  try {
    const database = await getDatabase();
    await database.runAsync('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    return { success: true };
  } catch (error) {
    console.error('Erreur setUserRole:', error);
    return { success: false, error: error.message };
  }
};

export const deleteUser = async (userId) => {
  try {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM users WHERE id = ?', [userId]);
    return { success: true };
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    return { success: false, error: error.message };
  }
};

export const getSubscriptions = async () => {
  try {
    const database = await getDatabase();
    const subs = await database.getAllAsync(
      `SELECT s.*, u.email, u.nom
       FROM subscriptions s
       JOIN users u ON u.id = s.userId
       ORDER BY s.updatedAt DESC`
    );
    return { success: true, data: subs };
  } catch (error) {
    console.error('Erreur getSubscriptions:', error);
    return { success: false, error: error.message };
  }
};

export const upsertSubscription = async (userId, plan, status, endsAt = null) => {
  try {
    const database = await getDatabase();
    const existing = await database.getFirstAsync(
      'SELECT id FROM subscriptions WHERE userId = ? ORDER BY id DESC LIMIT 1',
      [userId]
    );
    if (existing?.id) {
      await database.runAsync(
        `UPDATE subscriptions
         SET plan = ?, status = ?, endsAt = ?, updatedAt = datetime('now')
         WHERE id = ?`,
        [plan, status, endsAt, existing.id]
      );
      return { success: true, subscriptionId: existing.id };
    }

    const result = await database.runAsync(
      `INSERT INTO subscriptions (userId, plan, status, endsAt)
       VALUES (?, ?, ?, ?)`,
      [userId, plan, status, endsAt]
    );
    return { success: true, subscriptionId: result.lastInsertRowId };
  } catch (error) {
    console.error('Erreur upsertSubscription:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSubscription = async (subscriptionId) => {
  try {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM subscriptions WHERE id = ?', [subscriptionId]);
    return { success: true };
  } catch (error) {
    console.error('Erreur deleteSubscription:', error);
    return { success: false, error: error.message };
  }
};

export const getChatbotFaq = async () => {
  try {
    const database = await getDatabase();
    const faqs = await database.getAllAsync(
      `SELECT id, question, answer, tags FROM chatbot_faq ORDER BY id ASC`
    );
    return { success: true, data: faqs };
  } catch (error) {
    console.error('Erreur getChatbotFaq:', error);
    return { success: false, error: error.message };
  }
};

// ========== SUPPORT ==========
export const createSupportTicket = async (userId, subject, message) => {
  try {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO support_tickets (userId, subject, message) VALUES (?, ?, ?)`,
      [userId ?? null, subject, message]
    );
    return { success: true, ticketId: result.lastInsertRowId };
  } catch (error) {
    console.error('Erreur createSupportTicket:', error);
    return { success: false, error: error.message };
  }
};

export const getSupportTickets = async () => {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      `SELECT t.*, u.email, u.nom
       FROM support_tickets t
       LEFT JOIN users u ON u.id = t.userId
       ORDER BY t.createdAt DESC`
    );
    return { success: true, data: rows };
  } catch (error) {
    console.error('Erreur getSupportTickets:', error);
    return { success: false, error: error.message };
  }
};

export const updateSupportTicketStatus = async (ticketId, status) => {
  try {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE support_tickets SET status = ?, updatedAt = datetime('now') WHERE id = ?`,
      [status, ticketId]
    );
    return { success: true };
  } catch (error) {
    console.error('Erreur updateSupportTicketStatus:', error);
    return { success: false, error: error.message };
  }
};


export const getSubscriptionByUserId = async (userId) => {
  try {
    const database = await getDatabase();
    const row = await database.getFirstAsync(
      `SELECT * FROM subscriptions WHERE userId = ? ORDER BY id DESC LIMIT 1`,
      [userId]
    );
    return { success: true, data: row ?? null };
  } catch (error) {
    console.error('Erreur getSubscriptionByUserId:', error);
    return { success: false, error: error.message };
  }
};

export const ensureSubscriptionForUser = async (userId) => {
  try {
    const existing = await getSubscriptionByUserId(userId);
    if (existing.success && existing.data) return { success: true, data: existing.data };
    const created = await upsertSubscription(userId, 'free', 'pending', null);
    if (!created.success) return created;
    const row = await getSubscriptionByUserId(userId);
    return row;
  } catch (error) {
    console.error('Erreur ensureSubscriptionForUser:', error);
    return { success: false, error: error.message };
  }
};

export const requestActivationForUser = async (userId) => {
  try {
    const database = await getDatabase();
    const existing = await database.getFirstAsync(
      `SELECT id, status FROM subscriptions WHERE userId = ? ORDER BY id DESC LIMIT 1`,
      [userId]
    );
    if (existing?.id) {
      if (existing.status === 'active') return { success: true };
      await database.runAsync(
        `UPDATE subscriptions SET status = 'pending', updatedAt = datetime('now') WHERE id = ?`,
        [existing.id]
      );
      return { success: true };
    }

    await upsertSubscription(userId, 'free', 'pending', null);
    return { success: true };
  } catch (error) {
    console.error('Erreur requestActivationForUser:', error);
    return { success: false, error: error.message };
  }
};

// Mettre à jour l'image de profil
export const updateUserProfileImage = async (userId, imageProfil) => {
  try {
    const database = await getDatabase();
    
    await database.runAsync(
      'UPDATE users SET imageProfil = ? WHERE id = ?',
      [imageProfil, userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour image profil:', error);
    return { success: false, error: error.message };
  }
};

// Mettre à jour les informations utilisateur
export const updateUser = async (userId, nom, dateNaissance, imageProfil = null) => {
  try {
    const database = await getDatabase();
    
    if (imageProfil) {
      await database.runAsync(
        'UPDATE users SET nom = ?, dateNaissance = ?, imageProfil = ? WHERE id = ?',
        [nom, dateNaissance || null, imageProfil, userId]
      );
    } else {
      await database.runAsync(
        'UPDATE users SET nom = ?, dateNaissance = ? WHERE id = ?',
        [nom, dateNaissance || null, userId]
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    return { success: false, error: error.message };
  }
};

// Vérifier si un utilisateur est connecté (via AsyncStorage)
export const getCurrentUser = async () => {
  try {
    const userId = await AsyncStorage.getItem('currentUserId');
    if (!userId) {
      return null;
    }
    const result = await getUserById(parseInt(userId));
    if (result.success) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Erreur récupération utilisateur actuel:', error);
    return null;
  }
};

export const setCurrentUser = async (userId) => {
  try {
    if (userId) {
      await AsyncStorage.setItem('currentUserId', userId.toString());
    } else {
      await AsyncStorage.removeItem('currentUserId');
    }
  } catch (error) {
    console.error('Erreur sauvegarde utilisateur actuel:', error);
  }
};

// ========== GESTION DES STOCKS ==========

// Créer un stock
export const createStock = async (typeProduit, quantite, dateEntree, dateSortie = null, budget = null, zoneAgricole = null, description = null) => {
  try {
    const database = await getDatabase();
    
    const result = await database.runAsync(
      `INSERT INTO stocks (typeProduit, quantite, dateEntree, dateSortie, budget, zoneAgricole, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [typeProduit, quantite, dateEntree, dateSortie || null, budget || null, zoneAgricole || null, description || null]
    );
    
    return { 
      success: true, 
      stockId: result.lastInsertRowId 
    };
  } catch (error) {
    console.error('Erreur création stock:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir tous les stocks
export const getAllStocks = async () => {
  try {
    const database = await getDatabase();
    
    const stocks = await database.getAllAsync(
      'SELECT * FROM stocks ORDER BY createdAt DESC'
    );
    
    return { success: true, data: stocks };
  } catch (error) {
    console.error('Erreur récupération stocks:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir un stock par ID
export const getStockById = async (stockId) => {
  try {
    const database = await getDatabase();
    
    const stock = await database.getFirstAsync(
      'SELECT * FROM stocks WHERE id = ?',
      [stockId]
    );
    
    if (stock) {
      return { success: true, data: stock };
    } else {
      return { success: false, error: 'Stock non trouvé' };
    }
  } catch (error) {
    console.error('Erreur récupération stock:', error);
    return { success: false, error: error.message };
  }
};

// Mettre à jour un stock
export const updateStock = async (stockId, typeProduit, quantite, dateEntree, dateSortie = null, budget = null, zoneAgricole = null, description = null) => {
  try {
    const database = await getDatabase();
    
    await database.runAsync(
      `UPDATE stocks 
       SET typeProduit = ?, quantite = ?, dateEntree = ?, dateSortie = ?, 
           budget = ?, zoneAgricole = ?, description = ?, updatedAt = datetime('now')
       WHERE id = ?`,
      [typeProduit, quantite, dateEntree, dateSortie || null, budget || null, zoneAgricole || null, description || null, stockId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour stock:', error);
    return { success: false, error: error.message };
  }
};

// Supprimer un stock
export const deleteStock = async (stockId) => {
  try {
    const database = await getDatabase();
    
    await database.runAsync(
      'DELETE FROM stocks WHERE id = ?',
      [stockId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression stock:', error);
    return { success: false, error: error.message };
  }
};

