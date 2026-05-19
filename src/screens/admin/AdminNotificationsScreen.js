import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createAdminNotification,
  deleteAdminNotification,
  getAllAdminNotifications,
  toggleAdminNotificationActive,
} from '../../services/databaseService';

export default function AdminNotificationsScreen() {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [showAsPopup, setShowAsPopup] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await getAllAdminNotifications();
    if (res.success) setList(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Erreur', 'Titre et message sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const res = await createAdminNotification(title, message, showAsPopup);
      if (res.success) {
        Alert.alert('Succès', 'Notification publiée sur la page d’accueil.');
        setTitle('');
        setMessage('');
        setShowAsPopup(true);
        await load();
      } else {
        Alert.alert('Erreur', res.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    await toggleAdminNotificationActive(item.id, !item.isActive);
    await load();
  };

  const handleDelete = (item) => {
    Alert.alert('Supprimer', `Supprimer « ${item.title} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteAdminNotification(item.id);
          await load();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Nouvelle notification</Text>
        <Text style={styles.label}>Titre *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Bienvenue sur MonAppIA"
        />
        <Text style={styles.label}>Message *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Contenu affiché aux utilisateurs..."
          multiline
          numberOfLines={4}
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Afficher en popup à l’ouverture</Text>
          <Switch value={showAsPopup} onValueChange={setShowAsPopup} />
        </View>
        <TouchableOpacity
          style={[styles.publishBtn, saving && styles.disabled]}
          onPress={handleCreate}
          disabled={saving}
        >
          <Ionicons name="send" size={20} color="#fff" />
          <Text style={styles.publishBtnText}>
            {saving ? 'Publication...' : 'Publier la notification'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Notifications publiées ({list.length})</Text>
      {list.length === 0 ? (
        <Text style={styles.empty}>Aucune notification pour le moment.</Text>
      ) : (
        list.map((item) => (
          <View key={item.id} style={styles.notifCard}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              <View style={[styles.badge, item.isActive ? styles.badgeOn : styles.badgeOff]}>
                <Text style={styles.badgeText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            <Text style={styles.notifMessage}>{item.message}</Text>
            <Text style={styles.notifMeta}>
              {item.showAsPopup ? 'Popup' : 'Liste seulement'} • {item.createdAt}
            </Text>
            <View style={styles.notifActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggle(item)}>
                <Ionicons
                  name={item.isActive ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#2c5f2d"
                />
                <Text style={styles.actionBtnText}>{item.isActive ? 'Désactiver' : 'Activer'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={18} color="#c62828" />
                <Text style={[styles.actionBtnText, { color: '#c62828' }]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4f0d2' },
  content: { padding: 16, paddingBottom: 40 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#1B5E20', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  switchLabel: { flex: 1, fontSize: 14, color: '#333', marginRight: 8 },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c5f2d',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    gap: 8,
  },
  publishBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  disabled: { opacity: 0.6 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1f3f1f', marginBottom: 10 },
  empty: { color: '#666', fontStyle: 'italic', marginBottom: 20 },
  notifCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#fcb900',
  },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notifTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#222' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeOn: { backgroundColor: '#E8F5E9' },
  badgeOff: { backgroundColor: '#ffebee' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  notifMessage: { marginTop: 8, fontSize: 14, color: '#555', lineHeight: 20 },
  notifMeta: { marginTop: 8, fontSize: 11, color: '#999' },
  notifActions: { flexDirection: 'row', marginTop: 12, gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#2c5f2d' },
});
