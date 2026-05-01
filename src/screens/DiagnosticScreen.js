import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const DiagnosticScreen = () => {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const demoCases = useMemo(
    () => [
      {
        key: 'tomato_late_blight',
        maladie: 'Mildiou de la tomate (Late blight)',
        confiance: 0.86,
        symptomes: [
          'Taches brunes/noires irrégulières sur les feuilles',
          'Bords des feuilles brunis, aspect “brûlé”',
          'Propagation rapide par temps humide',
        ],
        traitement: [
          'Retirer les feuilles très atteintes et les détruire (ne pas composter)',
          'Améliorer l’aération (espacement), éviter l’arrosage sur le feuillage',
          'Traitement préventif: bouillie bordelaise (cuivre) selon réglementation locale',
        ],
        prevention: [
          'Arroser au pied le matin',
          'Rotation des cultures',
          'Surveiller l’humidité et éviter l’excès d’eau',
        ],
      },
      {
        key: 'tomato_early_blight',
        maladie: 'Alternariose (Early blight)',
        confiance: 0.82,
        symptomes: [
          'Taches circulaires avec anneaux concentriques (“cibles”)',
          'Jaunissement autour des lésions',
          'Souvent sur les feuilles âgées',
        ],
        traitement: [
          'Supprimer les feuilles atteintes',
          'Éviter les éclaboussures de sol (paillage)',
          'Fongicide autorisé en agriculture locale si nécessaire (suivre étiquette)',
        ],
        prevention: ['Paillage', 'Rotation', 'Arrosage au pied', 'Désinfection outils'],
      },
      {
        key: 'tomato_septoria',
        maladie: 'Tache foliaire de Septoria',
        confiance: 0.78,
        symptomes: [
          'Petites taches brunes avec centre plus clair',
          'Points noirs (pycnides) visibles au centre',
          'Défoliation progressive',
        ],
        traitement: [
          'Retirer feuilles atteintes',
          'Arroser sans mouiller le feuillage',
          'Traitement fongicide autorisé si la pression est forte',
        ],
        prevention: ['Éviter humidité sur feuilles', 'Rotation', 'Nettoyage résidus de culture'],
      },
      {
        key: 'tomato_powdery_mildew',
        maladie: 'Oïdium (Powdery mildew)',
        confiance: 0.74,
        symptomes: [
          'Poudre blanche sur feuille (aspect farineux)',
          'Feuilles qui jaunissent puis sèchent',
        ],
        traitement: [
          'Éliminer les parties très touchées',
          'Améliorer la ventilation',
          'Traitement soufre/bicarbonate (selon réglementation et dose)',
        ],
        prevention: ['Espacement', 'Aération', 'Éviter excès d’azote'],
      },
    ],
    []
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Autorisez l’accès aux photos pour uploader une image.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImageUri(res.assets[0].uri);
      setResult(null);
    }
  };

  const analyzeDemo = async () => {
    if (!imageUri) {
      Alert.alert('Image manquante', 'Veuillez uploader une image de tomate.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // Démo: sélection déterministe selon l’URI (pour que le même fichier donne le même résultat)
      const n = demoCases.length;
      const idx = (String(imageUri).length + String(imageUri).charCodeAt(0)) % n;
      const picked = demoCases[idx];
      await new Promise((r) => setTimeout(r, 700));
      setResult(picked);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Diagnostic (Démo)</Text>
            <Text style={styles.subtitle}>
              Uploade une photo de ta plante. Nous analysons l’image (IA) et proposons une maladie + traitement.
            </Text>
          </View>
          <Ionicons name="medical-outline" size={28} color="#fff" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1) Uploader une image (Galerie)</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.uploadText}>Choisir une photo</Text>
          </TouchableOpacity>

          {imageUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: imageUri }} style={styles.preview} />
              <View style={styles.previewBadge}>
                <Ionicons name="image-outline" size={14} color="#1f3f1f" />
                <Text style={styles.previewBadgeText}>Image sélectionnée</Text>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => setImageUri(null)}>
                <Ionicons name="close" size={18} color="#222" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.hint}>
              Démo recommandée: upload une photo de feuille de tomate (maladie courante).
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>2) Lancer le diagnostic</Text>
          <TouchableOpacity
            style={[
              styles.analyzeBtn,
              (loading || !imageUri) && styles.btnDisabled,
              !imageUri && styles.btnDisabledSecondary,
            ]}
            onPress={analyzeDemo}
            disabled={loading || !imageUri}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="sparkles-outline" size={20} color="#fff" />}
            <Text style={styles.analyzeText}>
              {loading ? 'Analyse...' : !imageUri ? 'Ajoutez une image pour analyser' : 'Analyser (tomate - démo)'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Note: c’est un démo offline. Plus tard, on peut brancher un vrai modèle IA.
          </Text>
        </View>

        {result && (
          <View style={[styles.card, styles.resultCard]}>
            <Text style={styles.resultTitle}>Résultat</Text>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="bug-outline" size={16} color="#2c5f2d" />
                <Text style={styles.badgeText}>{result.maladie}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="analytics-outline" size={16} color="#fcb900" />
                <Text style={styles.badgeText}>
                  Confiance: {Math.round(result.confiance * 100)}%
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#e8f1ff' }]}>
                <Ionicons name="leaf-outline" size={16} color="#2c5f2d" />
                <Text style={styles.badgeText}>Culture: Tomate</Text>
              </View>
            </View>

            <Text style={styles.section}>Symptômes</Text>
            {result.symptomes.map((s, i) => (
              <Text key={i} style={styles.li}>- {s}</Text>
            ))}

            <Text style={styles.section}>Traitement conseillé</Text>
            {result.traitement.map((s, i) => (
              <Text key={i} style={styles.li}>- {s}</Text>
            ))}

            <Text style={styles.section}>Prévention</Text>
            {result.prevention.map((s, i) => (
              <Text key={i} style={styles.li}>- {s}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4f0d2' },
  content: { padding: 16, paddingBottom: 28 },
  hero: {
    backgroundColor: '#2c5f2d',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 6, lineHeight: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#1f3f1f', marginBottom: 10 },
  uploadBtn: {
    backgroundColor: '#2c5f2d',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: { color: '#fff', fontWeight: '900' },
  analyzeBtn: {
    backgroundColor: '#fcb900',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeText: { color: '#000', fontWeight: '900' },
  btnDisabled: { opacity: 0.7 },
  btnDisabledSecondary: { backgroundColor: '#cfcfcf' },
  hint: { marginTop: 10, fontSize: 12, color: '#666', lineHeight: 18 },
  previewWrap: { marginTop: 12, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: 220, borderRadius: 14 },
  previewBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  previewBadgeText: { fontSize: 12, fontWeight: '900', color: '#1f3f1f' },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: { backgroundColor: '#f9fffb' },
  resultTitle: { fontSize: 16, fontWeight: '900', color: '#1f3f1f', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eaffea',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#1f3f1f' },
  section: { marginTop: 10, marginBottom: 6, fontSize: 13, fontWeight: '900', color: '#1f3f1f' },
  li: { fontSize: 12, color: '#333', lineHeight: 18 },
});

export default DiagnosticScreen;
