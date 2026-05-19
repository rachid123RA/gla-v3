import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Modal,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obtenirUtilisateurActuel, seDeconnecter } from '../services/authService';
import {
  updateUserProfileImage,
  updateUser,
  updateUserPassword,
} from '../services/databaseService';
import { persistProfileImage } from '../services/profileImageService';

const STORAGE_NOTIFICATIONS = 'settings_notifications';
const STORAGE_LANGUAGE = 'settings_language';

const SECTION_COLORS = {
  profil: { bg: '#E8F5E9', border: '#2E7D32', accent: '#1B5E20' },
  compte: { bg: '#E3F2FD', border: '#1565C0', accent: '#0D47A1' },
  app: { bg: '#FFF8E1', border: '#F9A825', accent: '#F57F17' },
};

const ParametresScreen = () => {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  const [imageProfil, setImageProfil] = useState(null);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState('Français');

  const loadUserData = useCallback(async () => {
    try {
      const currentUser = await obtenirUtilisateurActuel();
      if (currentUser) {
        setUserData(currentUser);
        setNom(currentUser.nom || '');
        setEmail(currentUser.email || '');
        setDateNaissance(currentUser.dateNaissance || '');
        setImageProfil(currentUser.imageProfil || null);
      }
    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error);
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const notif = await AsyncStorage.getItem(STORAGE_NOTIFICATIONS);
      if (notif !== null) setNotificationsEnabled(notif === 'true');
      const lang = await AsyncStorage.getItem(STORAGE_LANGUAGE);
      if (lang) setLanguage(lang);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const pickImage = async (saveImmediately = true) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Autorisez l’accès aux photos pour changer votre image de profil.'
      );
      return;
    }

    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d’ouvrir la galerie photos.');
      return;
    }

    if (result.canceled || !result.assets?.length) return;

    const pickedUri = result.assets[0].uri;
    if (!userData?.id) {
      setImageProfil(pickedUri);
      return;
    }

    setSavingImage(true);
    try {
      const persisted = await persistProfileImage(userData.id, pickedUri);
      if (!persisted.success) {
        Alert.alert('Erreur', persisted.error || 'Impossible de sauvegarder la photo.');
        return;
      }

      const permanentUri = persisted.uri;
      setImageProfil(permanentUri);

      if (!saveImmediately) return;

      const res = await updateUserProfileImage(userData.id, permanentUri);
      if (res.success) {
        setUserData((prev) => (prev ? { ...prev, imageProfil: permanentUri } : prev));
        Alert.alert('Succès', 'Photo de profil enregistrée.');
      } else {
        Alert.alert('Erreur', res.error || 'Impossible d’enregistrer la photo.');
      }
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l’enregistrement de la photo.');
    } finally {
      setSavingImage(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!nom.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire.');
      return;
    }

    setLoading(true);
    try {
      let finalImageUri = imageProfil;
      if (imageProfil) {
        const persisted = await persistProfileImage(userData.id, imageProfil);
        if (!persisted.success) {
          Alert.alert('Erreur', persisted.error || 'Impossible de sauvegarder la photo.');
          return;
        }
        finalImageUri = persisted.uri;
        setImageProfil(finalImageUri);
      }

      const result = await updateUser(
        userData.id,
        nom.trim(),
        dateNaissance.trim(),
        finalImageUri
      );

      if (result.success) {
        Alert.alert('Succès', 'Profil mis à jour avec succès.');
        setProfileModalVisible(false);
        await loadUserData();
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de mettre à jour le profil.');
      }
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserPassword(userData.id, currentPassword, newPassword);
      if (result.success) {
        Alert.alert('Succès', 'Mot de passe modifié avec succès.');
        setPasswordModalVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de modifier le mot de passe.');
      }
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem(STORAGE_NOTIFICATIONS, value ? 'true' : 'false');
  };

  const chooseLanguage = () => {
    Alert.alert('Langue', 'Choisissez la langue de l’interface', [
      {
        text: 'Français',
        onPress: async () => {
          setLanguage('Français');
          await AsyncStorage.setItem(STORAGE_LANGUAGE, 'Français');
        },
      },
      {
        text: 'العربية',
        onPress: async () => {
          setLanguage('العربية');
          await AsyncStorage.setItem(STORAGE_LANGUAGE, 'العربية');
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const openThemeInfo = () => {
    Alert.alert(
      'Thème',
      'Le thème clair est actuellement actif. Le thème sombre sera disponible dans une prochaine version.'
    );
  };

  const goToSupport = () => {
    try {
      navigation.navigate('Support');
    } catch {
      Alert.alert('Support', 'Ouvrez l’onglet Support depuis le menu principal.');
    }
  };

  const handleDeconnexion = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          try {
            await seDeconnecter();
          } catch {
            Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion.');
          }
        },
      },
    ]);
  };

  const openProfileModal = () => {
    setNom(userData?.nom || '');
    setDateNaissance(userData?.dateNaissance || '');
    setImageProfil(userData?.imageProfil || null);
    setProfileModalVisible(true);
  };

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5f2d" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderMenuItem = ({
    icon,
    label,
    onPress,
    sectionKey,
    rightElement,
    disabled,
  }) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { backgroundColor: SECTION_COLORS[sectionKey].bg, borderColor: SECTION_COLORS[sectionKey].border },
        disabled && styles.menuItemDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: SECTION_COLORS[sectionKey].accent }]}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Text style={styles.menuItemText}>{label}</Text>
      {rightElement || <Ionicons name="chevron-forward" size={20} color={SECTION_COLORS[sectionKey].accent} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1B5E20" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profil — vert */}
        <View style={[styles.section, styles.sectionProfil]}>
          <Text style={[styles.sectionTitle, { color: SECTION_COLORS.profil.accent }]}>Profil</Text>
          <View style={[styles.profileCard, { borderColor: SECTION_COLORS.profil.border }]}>
            <TouchableOpacity
              onPress={() => pickImage(true)}
              style={styles.profileImageContainer}
              disabled={savingImage}
            >
              {imageProfil ? (
                <Image
                  key={imageProfil}
                  source={{ uri: imageProfil }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={40} color="#888" />
                </View>
              )}
              <View style={[styles.editImageButton, { backgroundColor: SECTION_COLORS.profil.accent }]}>
                {savingImage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Appuyez sur la photo pour la changer</Text>

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{userData.nom?.toUpperCase()}</Text>
              <Text style={styles.userEmail}>{userData.email}</Text>
              {userData.role === 'admin' && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Administrateur</Text>
                </View>
              )}
              {userData.dateNaissance ? (
                <Text style={styles.userDate}>{userData.dateNaissance}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.sectionButton, { backgroundColor: SECTION_COLORS.profil.accent }]}
              onPress={openProfileModal}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.sectionButtonText}>Modifier le profil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compte — bleu */}
        <View style={[styles.section, styles.sectionCompte]}>
          <Text style={[styles.sectionTitle, { color: SECTION_COLORS.compte.accent }]}>Compte</Text>
          {renderMenuItem({
            icon: 'person-outline',
            label: 'Informations personnelles',
            onPress: openProfileModal,
            sectionKey: 'compte',
          })}
          {renderMenuItem({
            icon: 'lock-closed-outline',
            label: 'Changer le mot de passe',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setPasswordModalVisible(true);
            },
            sectionKey: 'compte',
          })}
          <View
            style={[
              styles.menuItem,
              styles.menuItemRow,
              {
                backgroundColor: SECTION_COLORS.compte.bg,
                borderColor: SECTION_COLORS.compte.border,
              },
            ]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: SECTION_COLORS.compte.accent }]}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.menuItemText}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#ccc', true: '#90CAF9' }}
              thumbColor={notificationsEnabled ? SECTION_COLORS.compte.accent : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Application — ambre */}
        <View style={[styles.section, styles.sectionApp]}>
          <Text style={[styles.sectionTitle, { color: SECTION_COLORS.app.accent }]}>Application</Text>
          {renderMenuItem({
            icon: 'language-outline',
            label: 'Langue',
            onPress: chooseLanguage,
            sectionKey: 'app',
            rightElement: <Text style={styles.menuItemValue}>{language}</Text>,
          })}
          {renderMenuItem({
            icon: 'moon-outline',
            label: 'Thème',
            onPress: openThemeInfo,
            sectionKey: 'app',
            rightElement: <Text style={styles.menuItemValue}>Clair</Text>,
          })}
          {renderMenuItem({
            icon: 'help-circle-outline',
            label: 'Aide et support',
            onPress: goToSupport,
            sectionKey: 'app',
          })}
          {renderMenuItem({
            icon: 'information-circle-outline',
            label: 'À propos',
            onPress: () => setAboutModalVisible(true),
            sectionKey: 'app',
          })}
        </View>

        <TouchableOpacity style={styles.deconnexionButton} onPress={handleDeconnexion}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.deconnexionButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal profil */}
      <Modal
        animationType="slide"
        transparent
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { borderBottomColor: SECTION_COLORS.profil.border }]}>
              <Text style={[styles.modalTitle, { color: SECTION_COLORS.profil.accent }]}>
                Modifier le profil
              </Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <TouchableOpacity onPress={() => pickImage(false)} style={styles.modalProfileImageContainer}>
                {imageProfil ? (
                  <Image
                    key={`modal-${imageProfil}`}
                    source={{ uri: imageProfil }}
                    style={styles.modalProfileImage}
                  />
                ) : (
                  <View style={styles.modalProfileImagePlaceholder}>
                    <Ionicons name="person" size={40} color="#888" />
                  </View>
                )}
                <View style={[styles.editImageButton, { backgroundColor: SECTION_COLORS.profil.accent }]}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.label}>Nom *</Text>
              <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Votre nom" />
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={email}
                editable={false}
                placeholder="Email"
              />
              <Text style={styles.label}>Date de naissance</Text>
              <TextInput
                style={styles.input}
                value={dateNaissance}
                onChangeText={setDateNaissance}
                placeholder="JJ/MM/AAAA"
              />
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: SECTION_COLORS.profil.accent }]}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal mot de passe */}
      <Modal
        animationType="slide"
        transparent
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { borderBottomColor: SECTION_COLORS.compte.border }]}>
              <Text style={[styles.modalTitle, { color: SECTION_COLORS.compte.accent }]}>
                Changer le mot de passe
              </Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Mot de passe actuel *</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Mot de passe actuel"
              />
              <Text style={styles.label}>Nouveau mot de passe *</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Au moins 6 caractères"
              />
              <Text style={styles.label}>Confirmer le nouveau mot de passe *</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Répétez le mot de passe"
              />
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: SECTION_COLORS.compte.accent }]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal à propos */}
      <Modal
        animationType="fade"
        transparent
        visible={aboutModalVisible}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.aboutBox}>
            <Ionicons name="leaf" size={48} color={SECTION_COLORS.profil.accent} />
            <Text style={styles.aboutTitle}>MonAppIA / GollaSense</Text>
            <Text style={styles.aboutText}>Version 1.0.0</Text>
            <Text style={styles.aboutText}>
              Application d’aide à la décision agricole : prédiction d’irrigation, chatbot, gestion
              des stocks et support.
            </Text>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: SECTION_COLORS.app.accent, marginTop: 16 }]}
              onPress={() => setAboutModalVisible(false)}
            >
              <Text style={styles.saveButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4f0d2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#2c5f2d',
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20', flex: 1, textAlign: 'center' },
  placeholder: { width: 34 },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#2c5f2d', fontSize: 16 },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionProfil: {},
  sectionCompte: {},
  sectionApp: {},
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: { position: 'relative', marginBottom: 8 },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 15,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoHint: { fontSize: 12, color: '#666', marginBottom: 12 },
  profileInfo: { alignItems: 'center', marginBottom: 16 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#666', marginBottom: 6 },
  userDate: { fontSize: 14, color: '#666' },
  roleBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  roleBadgeText: { color: '#1B5E20', fontWeight: '700', fontSize: 12 },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  sectionButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    gap: 12,
  },
  menuItemRow: { justifyContent: 'space-between' },
  menuItemDisabled: { opacity: 0.5 },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: { flex: 1, fontSize: 16, color: '#222', fontWeight: '500' },
  menuItemValue: { fontSize: 14, color: '#555', fontWeight: '600', marginRight: 4 },
  deconnexionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c62828',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  deconnexionButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalBody: { padding: 20 },
  modalProfileImageContainer: { alignSelf: 'center', position: 'relative', marginBottom: 16 },
  modalProfileImage: { width: 110, height: 110, borderRadius: 55 },
  modalProfileImagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputDisabled: { backgroundColor: '#eee', color: '#777' },
  saveButton: { borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  aboutBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  aboutTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 12, color: '#1B5E20' },
  aboutText: { fontSize: 14, color: '#555', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default ParametresScreen;
