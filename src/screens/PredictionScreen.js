import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';
import { getApiBaseUrl } from '../config/api';
import { obtenirUtilisateurActuel } from '../services/authService';
import { recordPrediction } from '../services/databaseService';

const PredictionScreen = () => {
  const navigation = useNavigation();
  const API_URL = getApiBaseUrl();

  useEffect(() => {
    console.log('[Prediction] API_URL =', API_URL);
  }, [API_URL]);
  
  // États pour les dropdowns
  const [openPlante, setOpenPlante] = useState(false);
  const [openSaison, setOpenSaison] = useState(false);
  const [openTypeSol, setOpenTypeSol] = useState(false);
  const [openEtat, setOpenEtat] = useState(false);
  
  // Fermer les autres dropdowns quand un s'ouvre
  const handleOpenPlante = (open) => {
    setOpenPlante(open);
    if (open) {
      setOpenSaison(false);
      setOpenTypeSol(false);
      setOpenEtat(false);
    }
  };
  
  const handleOpenSaison = (open) => {
    setOpenSaison(open);
    if (open) {
      setOpenPlante(false);
      setOpenTypeSol(false);
      setOpenEtat(false);
    }
  };
  
  const handleOpenTypeSol = (open) => {
    setOpenTypeSol(open);
    if (open) {
      setOpenPlante(false);
      setOpenSaison(false);
      setOpenEtat(false);
    }
  };
  
  const handleOpenEtat = (open) => {
    setOpenEtat(open);
    if (open) {
      setOpenPlante(false);
      setOpenSaison(false);
      setOpenTypeSol(false);
    }
  };
  
  // Valeurs des dropdowns
  const [plante, setPlante] = useState(null);
  const [saison, setSaison] = useState(null);
  const [typeSol, setTypeSol] = useState(null);
  const [etat, setEtat] = useState(null);
  
  // États pour les champs manuels
  const [date, setDate] = useState('');
  const [surface, setSurface] = useState('');
  const [age, setAge] = useState('');
  
  // États pour les résultats
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Options des dropdowns
  const plantes = [
    { label: 'Amandier', value: 'amandier' },
    { label: 'Aubergine', value: 'aubergine' },
    { label: 'Banane', value: 'banane' },
    { label: 'Basilic', value: 'basilic' },
    { label: 'Blé', value: 'ble' },
    { label: 'Carotte', value: 'carotte' },
    { label: 'Cerisier', value: 'cerisier' },
    { label: 'Citronnier', value: 'citronnier' },
    { label: 'Courgette', value: 'courgette' },
    { label: 'Figuier', value: 'figuier' },
    { label: 'Fraise', value: 'fraise' },
    { label: 'Laitue', value: 'laitue' },
    { label: 'Maïs', value: 'mais' },
    { label: 'Melon', value: 'melon' },
    { label: 'Menthe', value: 'menthe' },
    { label: 'Oranger', value: 'oranger' },
    { label: 'Pastèque', value: 'pasteque' },
    { label: 'Poivron', value: 'poivron' },
    { label: 'Pomme de terre', value: 'pomme_de_terre' },
    { label: 'Tomate', value: 'tomate' },
  ];
  
  const saisons = [
    { label: 'Printemps', value: 'printemps' },
    { label: 'Été', value: 'ete' },
    { label: 'Automne', value: 'automne' },
    { label: 'Hiver', value: 'hiver' },
  ];
  
  const typesSol = [
    { label: 'Argileux', value: 'argileux' },
    { label: 'Calcaire', value: 'calcaire' },
    { label: 'Limoneux', value: 'limoneux' },
    { label: 'Sableux', value: 'sableux' },
    { label: 'Tourbeux', value: 'tourbeux' },
  ];
  
  const etats = [
    { label: 'Bonne', value: 'bonne' },
    { label: 'Moyenne', value: 'moyenne' },
    { label: 'Mauvaise', value: 'mauvaise' },
  ];
  
  const handlePredict = async () => {
    // Validation
    if (!plante || !saison || !typeSol || !etat) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs de sélection');
      return;
    }
    
    if (!surface || !age) {
      Alert.alert('Erreur', 'Veuillez remplir la surface et l\'âge de la plante');
      return;
    }
    
    // Si une saison est sélectionnée, on génère une date correspondante
    // Sinon on valide la date fournie
    let dateToUse = date;
    if (saison && !date) {
      // Générer une date correspondant à la saison sélectionnée
      const currentYear = new Date().getFullYear();
      const seasonDates = {
        'printemps': `${currentYear}-04-15`, // Avril
        'ete': `${currentYear}-07-15`, // Juillet
        'automne': `${currentYear}-10-15`, // Octobre
        'hiver': `${currentYear}-01-15`, // Janvier
      };
      dateToUse = seasonDates[saison];
    } else if (date) {
      // Validation de la date (format YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        Alert.alert('Erreur', 'Le format de date doit être YYYY-MM-DD (ex: 2024-03-15)');
        return;
      }
    } else {
      Alert.alert('Erreur', 'Veuillez soit sélectionner une saison, soit entrer une date');
      return;
    }
    
    const surfaceNum = parseFloat(surface);
    const ageNum = parseInt(age);
    
    if (isNaN(surfaceNum) || surfaceNum <= 0) {
      Alert.alert('Erreur', 'La surface doit être un nombre positif');
      return;
    }
    
    if (isNaN(ageNum) || ageNum < 0) {
      Alert.alert('Erreur', 'L\'âge doit être un nombre positif');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/predict`,
        {
          nom_plante: plante,
          saison,
          type_sol: typeSol,
          etat_sante: etat,
          date: dateToUse,
          surface: surfaceNum,
          age_plante_jours: ageNum,
        },
        { timeout: 20000 }
      );
      
      setResult(response.data);

      // Stats: enregistrer qu'une prédiction a été faite (local SQLite)
      try {
        const currentUser = await obtenirUtilisateurActuel();
        await recordPrediction(currentUser?.id ?? null);
      } catch (e) {
        // Ignore: ne pas bloquer l'UX si stats échouent
      }
    } catch (error) {
      console.error('Erreur prédiction:', error);
      let errorMessage = 'Une erreur est survenue lors de la prédiction.';
      
      if (error.code === 'ECONNABORTED' || String(error.message || '').toLowerCase().includes('timeout')) {
        errorMessage =
          `Délai dépassé en appelant l'API (${API_URL}).\n\n` +
          `Vérifiez que:\n` +
          `1. L'API Flask répond bien sur cette URL (test: ${API_URL}/get-options)\n` +
          `2. Le téléphone/simulateur peut joindre l'ordinateur (même Wi‑Fi)\n` +
          `3. Le port est correct (ex: 5001 si 5000 est occupé)\n`;
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage =
          `Impossible de se connecter à l'API (${API_URL}). Assurez-vous que:\n\n` +
          `1. L'API Flask est démarrée (dans gollasense-api: python app.py)\n` +
          `2. Si vous êtes sur téléphone: utilisez l'IP du PC via EXPO_PUBLIC_API_URL\n` +
          `3. Le pare-feu autorise le port 5000\n\n` +
          `Astuce:\n- Android émulateur: ${'http://10.0.2.2:5000'}\n- iOS simulateur/Web: ${'http://localhost:5000'}`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setPlante(null);
    setSaison(null);
    setTypeSol(null);
    setEtat(null);
    setDate('');
    setSurface('');
    setAge('');
    setResult(null);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header avec flèche de retour */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prédiction d'Irrigation</Text>
          <TouchableOpacity
            onPress={resetForm}
            style={styles.resetButton}
          >
            <Ionicons name="refresh-outline" size={24} color="#2c5f2d" />
          </TouchableOpacity>
        </View>
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section Sélections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sélections</Text>
            
            {/* Nom de la plante */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.label}>Nom de la plante *</Text>
              <DropDownPicker
                open={openPlante}
                value={plante}
                items={plantes}
                setOpen={handleOpenPlante}
                setValue={setPlante}
                placeholder="Sélectionnez une plante"
                placeholderStyle={styles.placeholderStyle}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownList}
                textStyle={styles.dropdownText}
                selectedItemLabelStyle={styles.selectedItemLabelStyle}
                zIndex={4000}
                zIndexInverse={1000}
                listMode="MODAL"
                modalTitle="Sélectionnez une plante"
                modalAnimationType="slide"
              />
            </View>
            
            {/* Saison */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.label}>Saison *</Text>
              <DropDownPicker
                open={openSaison}
                value={saison}
                items={saisons}
                setOpen={handleOpenSaison}
                setValue={setSaison}
                placeholder="Sélectionnez une saison"
                placeholderStyle={styles.placeholderStyle}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownList}
                textStyle={styles.dropdownText}
                selectedItemLabelStyle={styles.selectedItemLabelStyle}
                zIndex={3000}
                zIndexInverse={2000}
                listMode="MODAL"
                modalTitle="Sélectionnez une saison"
                modalAnimationType="slide"
              />
            </View>
            
            {/* Type de sol */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.label}>Type de sol *</Text>
              <DropDownPicker
                open={openTypeSol}
                value={typeSol}
                items={typesSol}
                setOpen={handleOpenTypeSol}
                setValue={setTypeSol}
                placeholder="Sélectionnez un type de sol"
                placeholderStyle={styles.placeholderStyle}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownList}
                textStyle={styles.dropdownText}
                selectedItemLabelStyle={styles.selectedItemLabelStyle}
                zIndex={2000}
                zIndexInverse={3000}
                listMode="MODAL"
                modalTitle="Sélectionnez un type de sol"
                modalAnimationType="slide"
              />
            </View>
            
            {/* État de santé */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.label}>État de santé *</Text>
              <DropDownPicker
                open={openEtat}
                value={etat}
                items={etats}
                setOpen={handleOpenEtat}
                setValue={setEtat}
                placeholder="Sélectionnez un état"
                placeholderStyle={styles.placeholderStyle}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownList}
                textStyle={styles.dropdownText}
                selectedItemLabelStyle={styles.selectedItemLabelStyle}
                zIndex={1000}
                zIndexInverse={4000}
                listMode="MODAL"
                modalTitle="Sélectionnez un état"
                modalAnimationType="slide"
              />
            </View>
          </View>
          
          {/* Section Champs manuels */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations complémentaires</Text>
            
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <Text style={styles.helpText}>
              {saison ? 'La date sera générée automatiquement à partir de la saison sélectionnée' : 'Optionnel si une saison est sélectionnée'}
            </Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="Ex: 2024-03-15 (optionnel)"
              placeholderTextColor="#999"
              keyboardType="default"
              editable={!saison}
            />
            
            <Text style={styles.label}>Surface en m² *</Text>
            <TextInput
              style={styles.input}
              value={surface}
              onChangeText={setSurface}
              placeholder="Ex: 10.5"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
            
            <Text style={styles.label}>Âge de la plante (jours) *</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Ex: 30"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
          
          {/* Bouton de prédiction */}
          <TouchableOpacity
            style={[styles.predictButton, loading && styles.predictButtonDisabled]}
            onPress={handlePredict}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="water-outline" size={24} color="#fff" />
                <Text style={styles.predictButtonText}>Calculer la prédiction</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Résultats */}
          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Résultats de la prédiction</Text>
              
              <View style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <Ionicons name="water" size={24} color="#2c5f2d" />
                  <View style={styles.resultContent}>
                    <Text style={styles.resultLabel}>Quantité d'eau par m²</Text>
                    <Text style={styles.resultValue}>
                      {result.prediction_m2} L/m²/jour
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <Ionicons name="cube-outline" size={24} color="#2c5f2d" />
                  <View style={styles.resultContent}>
                    <Text style={styles.resultLabel}>Quantité totale nécessaire</Text>
                    <Text style={styles.resultValue}>
                      {result.prediction_totale} L/jour
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <Ionicons name="alert-circle-outline" size={24} color="#ff6b6b" />
                  <View style={styles.resultContent}>
                    <Text style={styles.resultLabel}>Indice de stress</Text>
                    <Text style={[styles.resultValue, { color: result.indice_stress > 50 ? '#ff6b6b' : '#2c5f2d' }]}>
                      {result.indice_stress}%
                    </Text>
                  </View>
                </View>
              </View>
              
              {result.conseil && (
                <View style={[styles.resultCard, styles.conseilCard]}>
                  <View style={styles.resultRow}>
                    <Ionicons name="bulb-outline" size={24} color="#fcb900" />
                    <View style={styles.resultContent}>
                      <Text style={styles.conseilLabel}>Conseil</Text>
                      <Text style={styles.conseilText}>{result.conseil}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
          
          {/* Espace en bas pour éviter que le contenu soit caché */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Barre de navigation en bas */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#2c5f2d" />
          <Text style={styles.navText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="analytics-outline" size={24} color="#2c5f2d" />
          <Text style={styles.navText}>Prédiction</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="stats-chart-outline" size={24} color="#2c5f2d" />
          <Text style={styles.navText}>Rapports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings-outline" size={24} color="#2c5f2d" />
          <Text style={styles.navText}>Paramètres</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d4f0d2',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  resetButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5f2d',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 12,
  },
  dropdownContainer: {
    marginBottom: 15,
    zIndex: 1000,
  },
  dropdown: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 50,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    borderRadius: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderStyle: {
    color: '#999',
  },
  selectedItemLabelStyle: {
    color: '#2c5f2d',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  predictButton: {
    backgroundColor: '#2c5f2d',
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  predictButtonDisabled: {
    opacity: 0.6,
  },
  predictButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 10,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5f2d',
    marginBottom: 15,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  resultContent: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5f2d',
  },
  conseilCard: {
    backgroundColor: '#fff9e6',
    borderWidth: 1,
    borderColor: '#fcb900',
  },
  conseilLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fcb900',
    marginBottom: 4,
  },
  conseilText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 12,
    color: '#2c5f2d',
    fontWeight: '500',
  },
});

export default PredictionScreen;

