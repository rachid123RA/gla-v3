import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { seConnecter } from '../services/authService';

const ConnexionScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnexion = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    const result = await seConnecter(email, password);

    if (result.success) {
      // La navigation sera gérée automatiquement par App.js qui détecte le changement d'état utilisateur
      // Pas besoin de naviguer manuellement avec la navigation conditionnelle
    } else {
      Alert.alert('Erreur de connexion', result.error);
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
          <View style={styles.topSection}>
            <Image
              source={require('../../assets/img/2.png')}
              style={styles.logo}
            />
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => navigation.navigate('Accueil')}
            >
              <Text style={styles.homeButtonText}>ACCUEIL</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.loginTitle}>Login</Text>
            <Text style={styles.loginSubtitle}>Sign in to continue.</Text>

            <Text style={styles.label}>NAME</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mot de passe"
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleConnexion}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Connexion...' : 'Log in'}
              </Text>
            </TouchableOpacity>

            <View style={styles.linkContainer}>
              <TouchableOpacity onPress={() => Alert.alert('Mot de passe oublié ?')}>
                <Text style={styles.link}>Forgot Password?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Inscription')}>
                <Text style={styles.link}>Signup !</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4f0d2' }, // vert clair
  keyboardView: { flex: 1 },
  topSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  homeButton: {
    marginTop: 10,
    backgroundColor: '#fcb900',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  homeButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 30,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
  },
  loginTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  loginSubtitle: {
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
  loginButton: {
    backgroundColor: '#fcb900',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  linkContainer: {
    alignItems: 'center',
    gap: 6,
  },
  link: {
    color: '#444',
    fontSize: 14,
  },
});

export default ConnexionScreen;
