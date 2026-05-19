import * as FileSystem from 'expo-file-system';

/**
 * Copie la photo choisie vers le répertoire documents de l'app
 * (URI stable — les URI du cache ImagePicker expirent souvent).
 */
export async function persistProfileImage(userId, sourceUri) {
  if (!userId || !sourceUri) {
    return { success: false, error: 'Utilisateur ou image manquant' };
  }

  const docDir = FileSystem.documentDirectory;
  if (!docDir) {
    return { success: true, uri: sourceUri };
  }

  const destUri = `${docDir}profile_${userId}.jpg`;

  try {
    if (sourceUri === destUri || sourceUri.startsWith(docDir)) {
      return { success: true, uri: destUri };
    }

    const info = await FileSystem.getInfoAsync(destUri);
    if (info.exists) {
      await FileSystem.deleteAsync(destUri, { idempotent: true });
    }

    await FileSystem.copyAsync({ from: sourceUri, to: destUri });

    const copied = await FileSystem.getInfoAsync(destUri);
    if (!copied.exists) {
      return { success: false, error: 'Copie de l’image impossible' };
    }

    return { success: true, uri: destUri };
  } catch (error) {
    console.error('persistProfileImage:', error);
    return { success: false, error: error.message || 'Erreur copie image' };
  }
}
