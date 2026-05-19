import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { obtenirUtilisateurActuel } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';
import { ensureActivationRequest, getSubscriptionStatusForCurrentUser } from '../services/subscriptionService';
import {
  dismissNotification,
  loadNotificationsForUser,
} from '../services/notificationService';

const ServicesScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState({ nom: '', dateNaissance: '', imageProfil: null, id: null });
  const [subscriptionStatus, setSubscriptionStatus] = useState({ status: 'unknown', plan: 'free' });
  const [search, setSearch] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popupNotification, setPopupNotification] = useState(null);
  const [listModalVisible, setListModalVisible] = useState(false);

  const chargerInfos = useCallback(async () => {
    const currentUser = await obtenirUtilisateurActuel();
    if (currentUser) {
      setUserData(currentUser);
      const notifData = await loadNotificationsForUser(currentUser.id);
      setNotifications(notifData.notifications);
      setUnreadCount(notifData.unreadCount);
      if (notifData.popupNotification) {
        setPopupNotification(notifData.popupNotification);
      }
    }
    const sub = await getSubscriptionStatusForCurrentUser();
    setSubscriptionStatus(sub);
  }, []);

  useFocusEffect(
    useCallback(() => {
      chargerInfos();
    }, [chargerInfos])
  );

  const closePopup = async () => {
    if (popupNotification && userData?.id) {
      await dismissNotification(userData.id, popupNotification.id);
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setPopupNotification(null);
  };

  const openNotificationsList = () => {
    setPopupNotification(null);
    setListModalVisible(true);
  };

  const requireActiveSubscription = async (onAllowed) => {
    const sub = await getSubscriptionStatusForCurrentUser();
    setSubscriptionStatus(sub);
    if (sub.status === 'active' || userData?.role === 'admin') {
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
      title: 'Diagnostic',
      desc: 'État des cultures',
      bgColor: '#a8e6cf',
      icon: require('../../assets/img/diagnostic.png'),
      needsSub: false,
    },
    {
      label: 'analyse',
      title: 'Analyse',
      desc: 'Graphiques & PDF',
      bgColor: '#dcedc1',
      icon: require('../../assets/img/analyse.png'),
      needsSub: false,
    },
    {
      label: 'prediction',
      title: 'Prédiction',
      desc: 'Irrigation IA',
      bgColor: '#ffd3b6',
      icon: require('../../assets/img/prediction.png'),
      needsSub: true,
    },
    {
      label: 'stock',
      title: 'Stock',
      desc: 'Inventaire',
      bgColor: '#e4c1f9',
      icon: require('../../assets/img/stock.png'),
      needsSub: false,
    },
    {
      label: 'chat boot',
      title: 'Chatbot',
      desc: 'Assistant',
      bgColor: '#c5cae9',
      icon: require('../../assets/img/chatbot.png'),
      needsSub: true,
    },
    {
      label: 'Capteurs',
      title: 'Capteurs',
      desc: 'Données temps réel',
      bgColor: '#fff176',
      icon: require('../../assets/img/capteur.png'),
      needsSub: false,
    },
  ];

  const filteredServices = services.filter(
    (s) =>
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.title.toLowerCase().includes(search.toLowerCase())
  );

  const navigateService = (s) => {
    const go = () => {
      if (s.label === 'diagnostic') navigation.navigate('Diagnostic');
      else if (s.label === 'analyse') navigation.navigate('Analyse');
      else if (s.label === 'prediction') navigation.navigate('Prediction');
      else if (s.label === 'stock') navigation.navigate('Stock');
      else if (s.label === 'chat boot') navigation.navigate('Chatbot');
      else if (s.label === 'Capteurs') navigation.navigate('Capteur');
    };
    if (s.needsSub) requireActiveSubscription(go);
    else go();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#2c5f2d', '#4a8f4c']} style={styles.headerGradient}>
          <View style={styles.header}>
            <View style={styles.userContainer}>
              {userData.imageProfil ? (
                <Image
                  key={userData.imageProfil}
                  source={{ uri: userData.imageProfil }}
                  style={styles.avatar}
                />
              ) : (
                <Image source={require('../../assets/img/user.png')} style={styles.avatar} />
              )}
              <View>
                <Text style={styles.welcome}>Bienvenue</Text>
                <Text style={styles.userName}>{userData.nom?.toUpperCase() || 'UTILISATEUR'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notifBtn} onPress={openNotificationsList}>
              <Ionicons name="notifications" size={26} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Ionicons name="leaf" size={18} color="#fcb900" />
              <Text style={styles.quickStatText}>6 services</Text>
            </View>
            <View style={styles.quickStat}>
              <Ionicons name="shield-checkmark" size={18} color="#fcb900" />
              <Text style={styles.quickStatText}>
                {subscriptionStatus.status === 'active' ? 'Compte actif' : 'En attente'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un service..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={styles.title}>Tous les services</Text>
        <Text style={styles.subtitle}>Choisissez un module pour commencer</Text>

        <View style={styles.grid}>
          {filteredServices.map((s, index) => (
            <TouchableOpacity
              key={index}
              style={styles.cardWrap}
              onPress={() => navigateService(s)}
              activeOpacity={0.85}
            >
              <View style={[styles.card, { backgroundColor: s.bgColor }]}>
                <View style={styles.cardIconRing}>
                  <Image source={s.icon} style={styles.serviceIcon} />
                </View>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardDesc}>{s.desc}</Text>
                {s.needsSub && subscriptionStatus.status !== 'active' && userData?.role !== 'admin' && (
                  <View style={styles.lockTag}>
                    <Ionicons name="lock-closed" size={10} color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {subscriptionStatus.status !== 'active' && userData?.role !== 'admin' && (
          <View style={styles.banner}>
            <View style={styles.bannerRow}>
              <Ionicons name="information-circle" size={22} color="#fcb900" />
              <View style={styles.bannerTextWrap}>
                <Text style={styles.bannerTitle}>Compte en attente d’activation</Text>
                <Text style={styles.bannerText}>
                  Prédiction et Chatbot nécessitent une activation admin.
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bannerBtn} onPress={() => requireActiveSubscription()}>
              <Text style={styles.bannerBtnText}>Demander activation</Text>
            </TouchableOpacity>
          </View>
        )}

        <Image source={require('../../assets/img/garden.png')} style={styles.gardenImage} />
      </ScrollView>

      {/* Popup notification (première visite / non fermée) */}
      <Modal visible={!!popupNotification} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <TouchableOpacity style={styles.popupClose} onPress={closePopup}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.popupIconWrap}>
              <Ionicons name="notifications" size={32} color="#2c5f2d" />
            </View>
            <Text style={styles.popupTitle}>{popupNotification?.title}</Text>
            <Text style={styles.popupMessage}>{popupNotification?.message}</Text>
            <TouchableOpacity style={styles.popupBtn} onPress={closePopup}>
              <Text style={styles.popupBtnText}>J’ai compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Liste des notifications */}
      <Modal visible={listModalVisible} transparent animationType="slide">
        <Pressable style={styles.listOverlay} onPress={() => setListModalVisible(false)}>
          <Pressable style={styles.listSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setListModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.listScroll}>
              {notifications.length === 0 ? (
                <Text style={styles.listEmpty}>Aucune notification pour le moment.</Text>
              ) : (
                notifications.map((n) => (
                  <View key={n.id} style={styles.notifItem}>
                    <Ionicons name="megaphone-outline" size={22} color="#2c5f2d" />
                    <View style={styles.notifItemBody}>
                      <Text style={styles.notifItemTitle}>{n.title}</Text>
                      <Text style={styles.notifItemMsg}>{n.message}</Text>
                      <Text style={styles.notifItemDate}>{n.createdAt}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f5e9' },
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  userContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#fcb900' },
  welcome: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  userName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  notifBtn: { padding: 8, position: 'relative' },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  quickStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quickStatText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: -16,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#333' },
  title: {
    paddingHorizontal: 20,
    fontSize: 22,
    fontWeight: '800',
    color: '#1B5E20',
    marginTop: 24,
  },
  subtitle: { paddingHorizontal: 20, fontSize: 13, color: '#666', marginTop: 4, marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  cardWrap: { width: '47%' },
  card: {
    borderRadius: 18,
    padding: 14,
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  cardIconRing: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 28,
    padding: 10,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a1a', textAlign: 'center' },
  cardDesc: { fontSize: 11, color: '#444', marginTop: 4, textAlign: 'center' },
  serviceIcon: { width: 36, height: 36, resizeMode: 'contain' },
  lockTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    padding: 4,
  },
  gardenImage: { width: '100%', height: 280, resizeMode: 'contain', marginTop: 8 },
  banner: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fcb900',
    gap: 12,
  },
  bannerRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bannerTextWrap: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#1f3f1f' },
  bannerText: { fontSize: 12, color: '#666', marginTop: 4 },
  bannerBtn: {
    backgroundColor: '#fcb900',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  bannerBtnText: { fontWeight: '800', color: '#000' },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  popupCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 4,
    borderTopColor: '#2c5f2d',
  },
  popupClose: { position: 'absolute', top: 12, right: 12, padding: 4, zIndex: 1 },
  popupIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  popupTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', textAlign: 'center' },
  popupMessage: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 20,
  },
  popupBtn: {
    backgroundColor: '#2c5f2d',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  popupBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  listOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  listSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20' },
  listScroll: { paddingHorizontal: 16 },
  listEmpty: { padding: 24, textAlign: 'center', color: '#888', fontStyle: 'italic' },
  notifItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notifItemBody: { flex: 1 },
  notifItemTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  notifItemMsg: { fontSize: 14, color: '#555', marginTop: 4, lineHeight: 20 },
  notifItemDate: { fontSize: 11, color: '#999', marginTop: 6 },
});

export default ServicesScreen;
