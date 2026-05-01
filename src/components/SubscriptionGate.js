import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ensureActivationRequest, getSubscriptionStatusForCurrentUser } from '../services/subscriptionService';

export default function SubscriptionGate({ children }) {
  const [sub, setSub] = useState({ status: 'unknown', plan: 'free' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await getSubscriptionStatusForCurrentUser();
      if (mounted) {
        setSub(s);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const request = async () => {
    await ensureActivationRequest();
    Alert.alert('Demande envoyée', "L'admin doit activer votre abonnement.");
    const refreshed = await getSubscriptionStatusForCurrentUser();
    setSub(refreshed);
  };

  if (loading) return null;
  if (sub.status === 'active') return children;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fonctionnalité désactivée</Text>
      <Text style={styles.text}>
        Votre compte est en attente d’activation par l’admin.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={request}>
        <Text style={styles.btnText}>Demander activation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4f0d2', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#1f3f1f', marginBottom: 8, textAlign: 'center' },
  text: { fontSize: 13, color: '#444', textAlign: 'center', marginBottom: 16 },
  btn: { backgroundColor: '#fcb900', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
  btnText: { fontWeight: '900', color: '#000' },
});

