import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteUser, getAllUsers, setUserRole } from '../../services/databaseService';
import { obtenirUtilisateurActuel } from '../../services/authService';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await getAllUsers();
    if (res.success) setUsers(res.data);
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

  const confirmDelete = useCallback((u) => {
    Alert.alert(
      'Supprimer utilisateur',
      `Supprimer ${u.email} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const me = await obtenirUtilisateurActuel();
            if (me?.id === u.id) {
              Alert.alert('Impossible', 'Vous ne pouvez pas supprimer votre propre compte admin.');
              return;
            }
            const res = await deleteUser(u.id);
            if (!res.success) Alert.alert('Erreur', res.error);
            await load();
          },
        },
      ]
    );
  }, [load]);

  const toggleRole = useCallback(async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    const me = await obtenirUtilisateurActuel();
    if (me?.id === u.id) {
      Alert.alert('Impossible', "Vous ne pouvez pas changer votre propre rôle depuis ici.");
      return;
    }
    const res = await setUserRole(u.id, newRole);
    if (!res.success) Alert.alert('Erreur', res.error);
    await load();
  }, [load]);

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.meta}>
          {item.nom} • {item.role}
        </Text>
      </View>

      <TouchableOpacity style={styles.iconBtn} onPress={() => toggleRole(item)}>
        <Ionicons name="swap-horizontal" size={18} color="#2c5f2d" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDelete(item)}>
        <Ionicons name="trash-outline" size={18} color="#c0392b" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(u) => String(u.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun utilisateur.</Text>}
      />
      <Text style={styles.hint}>
        Astuce: compte admin par défaut = admin@monappia.local / admin123
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4f0d2' },
  list: { padding: 14, paddingBottom: 40 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowMain: { flex: 1 },
  email: { fontSize: 15, fontWeight: '700', color: '#222' },
  meta: { marginTop: 4, fontSize: 12, color: '#666' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { padding: 20, textAlign: 'center', color: '#666' },
  hint: { paddingHorizontal: 14, paddingBottom: 12, color: '#666', fontSize: 12 },
});

