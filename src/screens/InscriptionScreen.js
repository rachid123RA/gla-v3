import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { creerCompte } from '../services/authService';
import { updateUserProfileImage } from '../services/databaseService';
import { persistProfileImage } from '../services/profileImageService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const InscriptionScreen = ({ navigation }) => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [imageProfil, setImageProfil] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Demander les permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
      return;
    }

    // Ouvrir le sélecteur d'image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageProfil(result.assets[0].uri);
    }
  };

  const handleInscription = async () => {
    if (!nom || !email || !password || !dateNaissance) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    const result = await creerCompte(email, password, nom, dateNaissance, null);

    if (result.success && imageProfil && result.user?.id) {
      const persisted = await persistProfileImage(result.user.id, imageProfil);
      if (persisted.success) {
        await updateUserProfileImage(result.user.id, persisted.uri);
      }
    }

    if (result.success) {
      Alert.alert(
        'Succès',
        'Votre compte a été créé avec succès !',
        [{ text: 'OK' }]
      );
      // La navigation sera gérée automatiquement par App.js qui détecte le changement d'état utilisateur
    } else {
      Alert.alert('Erreur', result.error);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Flèche retour */}
          <TouchableOpacity
            style={styles.backArrow}
            onPress={() => navigation.navigate('Connexion')}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Create new{"\n"}Account</Text>
            <Text style={styles.subtitle}>
              Already Registered? Log in here.
            </Text>

            {/* Sélection de photo de profil */}
            <View style={styles.profileImageContainer}>
              <TouchableOpacity onPress={pickImage} style={styles.profileImageButton}>
                {imageProfil ? (
                  <Image source={{ uri: imageProfil }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="camera" size={40} color="#888" />
                    <Text style={styles.profileImageText}>Photo de profil</Text>
                  </View>
                )}
              </TouchableOpacity>
              {imageProfil && (
                <TouchableOpacity 
                  onPress={() => setImageProfil(null)} 
                  style={styles.removeImageButton}
                >
                  <Ionicons name="close-circle" size={24} color="#ff4444" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>NAME</Text>
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={setNom}
              placeholder="Entrez votre nom"
            />

            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Entrez votre email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Entrez votre mot de passe"
              secureTextEntry
            />

            <Text style={styles.label}>DATE OF BIRTH</Text>
            <TextInput
              style={styles.input}
              value={dateNaissance}
              onChangeText={setDateNaissance}
              placeholder="JJ/MM/AAAA"
            />

            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleInscription}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Création...' : 'Sign up'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d4f0d2', // fond vert clair
  },
  keyboardView: {
    flex: 1,
  },
  backArrow: {
    marginTop: 40,
    marginLeft: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    flex: 1,
    marginTop: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  signupButton: {
    backgroundColor: '#fcb900',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profileImageButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
});

export default InscriptionScreen;
