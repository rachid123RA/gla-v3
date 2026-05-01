import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteSubscription, getAllUsers, getSubscriptions, upsertSubscription } from '../../services/databaseService';

const PLANS = ['free', 'basic', 'pro'];
const STATUSES = ['pending', 'active', 'paused', 'cancelled', 'expired'];
const DURATIONS = [
  { label: '1 mois', months: 1 },
  { label: '2 mois', months: 2 },
  { label: '3 mois', months: 3 },
  { label: '12 mois (annuel)', months: 12 },
];

function addMonthsToNow(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export default function AdminSubscriptionsScreen() {
  const [subs, setSubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDay, setFilterDay] = useState(''); // YYYY-MM-DD

  const load = useCallback(async () => {
    const [sRes, uRes] = await Promise.all([getSubscriptions(), getAllUsers()]);
    if (sRes.success) setSubs(sRes.data);
    if (uRes.success) setUsers(uRes.data);
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

  const createOrUpdate = useCallback(
    async (userId, existingSub = null) => {
      Alert.alert('Choisir un plan', 'Sélectionnez le plan', PLANS.map((p) => ({
        text: p,
        onPress: async () => {
          Alert.alert(
            'Statut',
            'Sélectionnez le statut',
            STATUSES.filter((x) => x !== 'expired').map((s) => ({
              text: s,
              onPress: async () => {
                if (s === 'active') {
                  Alert.alert(
                    'Durée',
                    "Choisissez la durée d'activation",
                    DURATIONS.map((d) => ({
                      text: d.label,
                      onPress: async () => {
                        const endsAt = addMonthsToNow(d.months);
                        const res = await upsertSubscription(userId, p, 'active', endsAt);
                        if (!res.success) Alert.alert('Erreur', res.error);
                        await load();
                      },
                    })).concat([{ text: 'Annuler', style: 'cancel' }])
                  );
                  return;
                }

                const res = await upsertSubscription(userId, p, s, existingSub?.endsAt ?? null);
                if (!res.success) Alert.alert('Erreur', res.error);
                await load();
              },
            })).concat([{ text: 'Annuler', style: 'cancel' }])
          );
        },
      })).concat([{ text: 'Annuler', style: 'cancel' }]));
    },
    [load]
  );

  const confirmDelete = useCallback(
    (sub) => {
      Alert.alert(
        'Supprimer abonnement',
        `Supprimer l'abonnement de ${sub.email} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              const res = await deleteSubscription(sub.id);
              if (!res.success) Alert.alert('Erreur', res.error);
              await load();
            },
          },
        ]
      );
    },
    [load]
  );

  const renderSub = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.title}>{item.email}</Text>
        <Text style={styles.meta}>
          Plan: {item.plan} • Statut: {item.status}
          {item.endsAt ? ` • fin: ${String(item.endsAt).slice(0, 10)}` : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.iconBtn} onPress={() => createOrUpdate(item.userId, item)}>
        <Ionicons name="create-outline" size={18} color="#2c5f2d" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDelete(item)}>
        <Ionicons name="trash-outline" size={18} color="#c0392b" />
      </TouchableOpacity>
    </View>
  );

  const renderUserWithoutSub = ({ item }) => (
    <TouchableOpacity style={styles.addRow} onPress={() => createOrUpdate(item.id)}>
      <Ionicons name="add-circle-outline" size={18} color="#2c5f2d" />
      <Text style={styles.addText}>{item.email}</Text>
    </TouchableOpacity>
  );

  const usersWithSub = new Set(subs.map((s) => s.userId));
  const usersWithoutSub = users.filter((u) => !usersWithSub.has(u.id));

  const filteredSubs = subs.filter((s) => {
    if (filterPlan && String(s.plan) !== filterPlan) return false;
    if (filterStatus && String(s.status) !== filterStatus) return false;
    if (filterDay) {
      const day = String(filterDay).trim();
      const created = String(s.createdAt ?? '').slice(0, 10);
      const updated = String(s.updatedAt ?? '').slice(0, 10);
      if (created !== day && updated !== day) return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredSubs}
        keyExtractor={(s) => String(s.id)}
        renderItem={renderSub}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <Text style={styles.section}>Abonnements existants</Text>
            <View style={styles.filters}>
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.chip, filterPlan === '' && styles.chipActive]}
                  onPress={() => setFilterPlan('')}
                >
                  <Text style={[styles.chipText, filterPlan === '' && styles.chipTextActive]}>Tous</Text>
                </TouchableOpacity>
                {PLANS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, filterPlan === p && styles.chipActive]}
                    onPress={() => setFilterPlan(p)}
                  >
                    <Text style={[styles.chipText, filterPlan === p && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.chip, filterStatus === '' && styles.chipActive]}
                  onPress={() => setFilterStatus('')}
                >
                  <Text style={[styles.chipText, filterStatus === '' && styles.chipTextActive]}>Tous statuts</Text>
                </TouchableOpacity>
                {['pending', 'active', 'paused', 'cancelled'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, filterStatus === s && styles.chipActive]}
                    onPress={() => setFilterStatus(s)}
                  >
                    <Text style={[styles.chipText, filterStatus === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.dateFilter}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <TextInput
                  value={filterDay}
                  onChangeText={setFilterDay}
                  placeholder="Filtrer par jour (YYYY-MM-DD)"
                  placeholderTextColor="#888"
                  style={styles.dateInput}
                />
                <TouchableOpacity style={styles.clearBtn} onPress={() => setFilterDay('')}>
                  <Ionicons name="close" size={16} color="#222" />
                </TouchableOpacity>
              </View>
            </View>

            {subs.length === 0 ? <Text style={styles.empty}>Aucun abonnement.</Text> : null}
            <Text style={[styles.section, { marginTop: 18 }]}>Créer un abonnement</Text>
            <Text style={styles.sectionHint}>Choisissez un utilisateur.</Text>
            <FlatList
              data={usersWithoutSub}
              keyExtractor={(u) => `u-${u.id}`}
              renderItem={renderUserWithoutSub}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.empty}>Tous les utilisateurs ont déjà un abonnement.</Text>}
            />
            <Text style={[styles.section, { marginTop: 18 }]}>Modifier</Text>
            <Text style={styles.sectionHint}>Tapez sur le crayon sur une ligne d’abonnement.</Text>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4f0d2' },
  list: { padding: 14, paddingBottom: 30 },
  section: { fontSize: 16, fontWeight: 'bold', color: '#1f3f1f', marginBottom: 8 },
  sectionHint: { fontSize: 12, color: '#666', marginBottom: 10 },
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
  title: { fontSize: 15, fontWeight: '700', color: '#222' },
  meta: { marginTop: 4, fontSize: 12, color: '#666' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 10,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#f3f3f3',
  },
  chipActive: { backgroundColor: '#2c5f2d' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#222' },
  chipTextActive: { color: '#fff' },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3f3f3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateInput: { flex: 1, fontSize: 12, color: '#222' },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addText: { fontSize: 14, fontWeight: '600', color: '#222' },
  empty: { color: '#666', marginBottom: 8 },
});

