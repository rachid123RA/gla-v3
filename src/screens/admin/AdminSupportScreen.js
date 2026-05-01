import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSupportTickets, updateSupportTicketStatus } from '../../services/databaseService';

const STATUSES = ['open', 'in_progress', 'closed'];

export default function AdminSupportScreen() {
  const [tickets, setTickets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const res = await getSupportTickets();
    if (res.success) setTickets(res.data);
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

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (!query) return true;
      const hay = `${t.subject} ${t.message} ${t.email ?? ''} ${t.nom ?? ''}`.toLowerCase();
      return hay.includes(query);
    });
  }, [tickets, filterStatus, q]);

  const openDetails = (t) => {
    Alert.alert(
      `Ticket #${t.id}`,
      `De: ${t.email ?? 'inconnu'}\nSujet: ${t.subject}\nStatut: ${t.status}\n\nMessage:\n${t.message}`,
      [
        { text: 'Fermer', style: 'cancel' },
        ...STATUSES.map((s) => ({
          text: `Marquer: ${s}`,
          onPress: async () => {
            const res = await updateSupportTicketStatus(t.id, s);
            if (!res.success) Alert.alert('Erreur', res.error);
            await load();
          },
        })),
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.row} onPress={() => openDetails(item)}>
      <View style={styles.rowMain}>
        <Text style={styles.subject}>{item.subject}</Text>
        <Text style={styles.meta}>
          {item.email ?? 'inconnu'} • {String(item.createdAt ?? '').slice(0, 10)}
        </Text>
      </View>
      <View style={[styles.statusPill, styles[`pill_${item.status}`] ?? styles.pill_open]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.chip, filterStatus === '' && styles.chipActive]}
            onPress={() => setFilterStatus('')}
          >
            <Text style={[styles.chipText, filterStatus === '' && styles.chipTextActive]}>Tous</Text>
          </TouchableOpacity>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, filterStatus === s && styles.chipActive]}
              onPress={() => setFilterStatus(s)}
            >
              <Text style={[styles.chipText, filterStatus === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.search}>
          <Ionicons name="search" size={16} color="#666" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Rechercher (email, sujet, message)…"
            placeholderTextColor="#888"
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.clearBtn} onPress={() => setQ('')}>
            <Ionicons name="close" size={16} color="#222" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => String(t.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun ticket.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4f0d2' },
  filters: {
    margin: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#f3f3f3' },
  chipActive: { backgroundColor: '#2c5f2d' },
  chipText: { fontSize: 12, fontWeight: '800', color: '#222' },
  chipTextActive: { color: '#fff' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3f3f3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 12, color: '#222' },
  clearBtn: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 14, paddingBottom: 30 },
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
  subject: { fontSize: 15, fontWeight: '900', color: '#222' },
  meta: { marginTop: 4, fontSize: 12, color: '#666' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '900', color: '#000' },
  pill_open: { backgroundColor: '#fff3e0' },
  pill_in_progress: { backgroundColor: '#e8f1ff' },
  pill_closed: { backgroundColor: '#eaffea' },
  empty: { textAlign: 'center', color: '#666', padding: 20 },
});

