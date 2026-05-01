// src/screens/AccueilScreen.js
import React from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, SafeAreaView,
  Image
} from 'react-native';

const AccueilScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/img/2.png')}
          style={styles.logo}
        />

        <Image
          source={require('../../assets/img/1.png')}
          style={styles.image}
        />

        <Text style={styles.title}>BIENVENUE DANS OLLA+</Text>

        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => navigation.navigate('Connexion')}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>

        <Text style={styles.skipText}>rachid & amina</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Connexion')}>
          <Text style={styles.skipNow}>Skip Now →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  logo: { width: 150, height: 150, resizeMode: 'contain' },
  image: { width: 400, height: 400 },
  title: {
    fontSize: 22, fontWeight: 'bold', color: '#000',
    textAlign: 'center', marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: '#fcb900', paddingVertical: 12,
    paddingHorizontal: 30, borderRadius: 10, marginBottom: 15
  },
  getStartedText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  skipText: { color: '#888', fontStyle: 'italic' },
  skipNow: {
    marginTop: 5, fontSize: 14,
    color: '#000', textDecorationLine: 'underline'
  },
});

export default AccueilScreen;
