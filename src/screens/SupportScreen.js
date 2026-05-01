import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { obtenirUtilisateurActuel } from '../services/authService';
import { createSupportTicket } from '../services/databaseService';

const SupportScreen = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un sujet et un message.');
      return;
    }
    setSending(true);
    try {
      const user = await obtenirUtilisateurActuel();
      const res = await createSupportTicket(user?.id ?? null, subject.trim(), message.trim());
      if (!res.success) {
        Alert.alert('Erreur', res.error);
        return;
      }
      setSubject('');
      setMessage('');
      Alert.alert('Envoyé', "Votre demande a été envoyée au support (admin).");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Support</Text>
            <Text style={styles.subtitle}>Contactez-nous ou envoyez une demande.</Text>
          </View>
          <Ionicons name="headset-outline" size={28} color="#fff" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contacts</Text>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={18} color="#2c5f2d" />
            <Text style={styles.contactText}>support@monappia.local</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={18} color="#2c5f2d" />
            <Text style={styles.contactText}>+212 6 00 00 00 00</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="time-outline" size={18} color="#2c5f2d" />
            <Text style={styles.contactText}>Lun–Ven, 09:00–18:00</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Envoyer une demande</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Sujet (ex: activation, bug, abonnement...)"
            placeholderTextColor="#888"
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Message..."
            placeholderTextColor="#888"
            multiline
          />
          <TouchableOpacity style={[styles.btn, sending && styles.btnDisabled]} onPress={submit} disabled={sending}>
            <Text style={styles.btnText}>{sending ? 'Envoi...' : 'Envoyer'}</Text>
          </TouchableOpacity>
        </View>
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
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 6 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#1f3f1f', marginBottom: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  contactText: { fontSize: 13, color: '#222', fontWeight: '600' },
  input: {
    backgroundColor: '#f3f3f3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#222',
    marginBottom: 10,
  },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  btn: { backgroundColor: '#fcb900', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontWeight: '900', color: '#000' },
  btnDisabled: { opacity: 0.7 },
});

export default SupportScreen;
