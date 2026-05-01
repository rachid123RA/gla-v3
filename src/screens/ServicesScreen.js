import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { obtenirUtilisateurActuel } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';
import { ensureActivationRequest, getSubscriptionStatusForCurrentUser } from '../services/subscriptionService';

const ServicesScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState({ nom: '', dateNaissance: '', imageProfil: null });
  const [subscriptionStatus, setSubscriptionStatus] = useState({ status: 'unknown', plan: 'free' });

  useEffect(() => {
    const chargerInfos = async () => {
      const currentUser = await obtenirUtilisateurActuel();
      if (currentUser) {
        setUserData(currentUser);
      }
      const sub = await getSubscriptionStatusForCurrentUser();
      setSubscriptionStatus(sub);
    };
    chargerInfos();
  }, []);

  const requireActiveSubscription = async (onAllowed) => {
    const sub = await getSubscriptionStatusForCurrentUser();
    setSubscriptionStatus(sub);
    if (sub.status === 'active') {
      onAllowed?.();
      return;
    }

    Alert.alert(
      'Accès non activé',
      "Votre compte n'est pas encore activé par l'admin.\n\nSouhaitez-vous envoyer une demande d’activation ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Demander',
          onPress: async () => {
            await ensureActivationRequest();
            Alert.alert('Demande envoyée', "L'admin doit activer votre abonnement.");
            const refreshed = await getSubscriptionStatusForCurrentUser();
            setSubscriptionStatus(refreshed);
          },
        },
      ]
    );
  };

  const services = [
    {
      label: 'diagnostic',
      bgColor: '#a8e6cf',
      icon: require('../../assets/img/diagnostic.png'),
    },
    {
      label: 'analyse',
      bgColor: '#dcedc1',
      icon: require('../../assets/img/analyse.png'),
    },
    {
      label: 'prediction',
      bgColor: '#ffd3b6',
      icon: require('../../assets/img/prediction.png'),
    },
    {
      label: 'stock',
      bgColor: '#e4c1f9',
      icon: require('../../assets/img/stock.png'),
    },
    {
      label: 'chat boot',
      bgColor: '#c5cae9',
      icon: require('../../assets/img/chatbot.png'),
    },
    {
      label: 'Capteurs',
      bgColor: '#fff176',
      icon: require('../../assets/img/capteur.png'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* En-tête utilisateur */}
        <View style={styles.header}>
          <View style={styles.userContainer}>
            {userData.imageProfil ? (
              <Image
                source={{ uri: userData.imageProfil }}
                style={styles.avatar}
              />
            ) : (
              <Image
                source={require('../../assets/img/user.png')}
                style={styles.avatar}
              />
            )}
            <View>
              <Text style={styles.userName}>{userData.nom?.toUpperCase()}</Text>
              <Text style={styles.userSubtitle}>{userData.dateNaissance}</Text>
            </View>
          </View>
          <Ionicons name="notifications-outline" size={24} color="#444" />
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un service..."
            placeholderTextColor="#888"
          />
        </View>

        {/* Titre section */}
        <Text style={styles.title}>Toutes les services</Text>

        {/* Cartes de services */}
        <View style={styles.grid}>
          {services.map((s, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, { backgroundColor: s.bgColor }]}
              onPress={() => {
                requireActiveSubscription(() => {
                  if (s.label === 'diagnostic') navigation.navigate('Diagnostic');
                  else if (s.label === 'analyse') navigation.navigate('Analyse');
                  else if (s.label === 'prediction') navigation.navigate('Prediction');
                  else if (s.label === 'stock') navigation.navigate('Stock');
                  else if (s.label === 'chat boot') navigation.navigate('Chatbot');
                  else if (s.label === 'Capteurs') navigation.navigate('Capteur');
                });
}}

            >
              <Image source={s.icon} style={styles.serviceIcon} />
              <Text style={styles.cardLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {subscriptionStatus.status !== 'active' && (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Compte en attente d’activation</Text>
            <Text style={styles.bannerText}>
              Certaines fonctionnalités sont désactivées jusqu’à validation par l’admin.
            </Text>
            <TouchableOpacity style={styles.bannerBtn} onPress={() => requireActiveSubscription()}>
              <Text style={styles.bannerBtnText}>Demander activation</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Image illustrative */}
        <Image
          source={require('../../assets/img/garden.png')}
          style={styles.gardenImage}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4f0d2' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userSubtitle: {
    fontSize: 12,
    color: '#777',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
  },
  title: {
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 10,
    paddingHorizontal: 10,
  },
  card: {
    width: 100,
    height: 100,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    padding: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  serviceIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  gardenImage: {
    width: '100%',
    height: 340,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginVertical: 0,
  },
  banner: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fcb900',
  },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: '#1f3f1f' },
  bannerText: { marginTop: 6, fontSize: 12, color: '#666' },
  bannerBtn: {
    marginTop: 12,
    backgroundColor: '#fcb900',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  bannerBtnText: { fontWeight: '800', color: '#000' },
});

export default ServicesScreen;
