import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAdminMetrics } from '../../services/databaseService';
import { BarChart, PieChart } from 'react-native-gifted-charts';

export default function AdminDashboardScreen({ navigation }) {
  const [metrics, setMetrics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await getAdminMetrics();
    if (res.success) setMetrics(res.data);
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Dashboard Admin</Text>
        <Text style={styles.heroSubtitle}>Vue globale (comptes, prédictions, abonnements)</Text>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, styles.cardGreen]}>
          <Text style={styles.cardLabel}>Comptes créés</Text>
          <Text style={styles.cardValue}>{metrics?.totalUsers ?? '-'}</Text>
        </View>
        <View style={[styles.card, styles.cardOrange]}>
          <Text style={styles.cardLabel}>Prédictions</Text>
          <Text style={styles.cardValue}>{metrics?.totalPredictions ?? '-'}</Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, styles.cardBlue]}>
          <Text style={styles.cardLabel}>Utilisateurs actifs</Text>
          <Text style={styles.cardValue}>{metrics?.usersWithPredictions ?? '-'}</Text>
          <Text style={styles.cardHint}>(au moins 1 prédiction)</Text>
        </View>
        <View style={[styles.card, styles.cardPurple]}>
          <Text style={styles.cardLabel}>Abonnements</Text>
          <Text style={styles.cardValue}>{metrics?.totalSubscriptions ?? '-'}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Diagrammes</Text>
      <View style={styles.chartsRow}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Prédictions vs Comptes</Text>
          <BarChart
            barWidth={24}
            spacing={22}
            roundedTop
            hideRules
            yAxisThickness={0}
            xAxisThickness={0}
            noOfSections={4}
            data={[
              { value: metrics?.totalUsers ?? 0, label: 'Comptes', frontColor: '#2c5f2d' },
              { value: metrics?.totalPredictions ?? 0, label: 'Préd.', frontColor: '#fcb900' },
            ]}
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Actifs vs Inactifs</Text>
          <PieChart
            donut
            radius={70}
            innerRadius={42}
            data={[
              {
                value: metrics?.usersWithPredictions ?? 0,
                color: '#2c5f2d',
                text: 'Actifs',
              },
              {
                value: Math.max((metrics?.totalUsers ?? 0) - (metrics?.usersWithPredictions ?? 0), 0),
                color: '#e0e0e0',
                text: 'Autres',
              },
            ]}
            centerLabelComponent={() => (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 16, color: '#1f3f1f' }}>
                  {metrics?.usersWithPredictions ?? 0}
                </Text>
                <Text style={{ fontSize: 11, color: '#666' }}>actifs</Text>
              </View>
            )}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Gestion</Text>

      <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('AdminUsers')}>
        <Ionicons name="people-outline" size={22} color="#2c5f2d" />
        <Text style={styles.actionText}>Gestion des utilisateurs</Text>
        <Ionicons name="chevron-forward" size={18} color="#999" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('AdminSubscriptions')}>
        <Ionicons name="card-outline" size={22} color="#2c5f2d" />
        <Text style={styles.actionText}>Gestion des abonnements</Text>
        <Ionicons name="chevron-forward" size={18} color="#999" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4f0d2' },
  content: { padding: 16, paddingBottom: 30 },
  hero: {
    backgroundColor: '#2c5f2d',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 6, fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f3f1f', marginTop: 18, marginBottom: 10 },
  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardGreen: { backgroundColor: '#eaffea' },
  cardOrange: { backgroundColor: '#fff3e0' },
  cardBlue: { backgroundColor: '#e8f1ff' },
  cardPurple: { backgroundColor: '#f5e9ff' },
  cardLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  cardValue: { fontSize: 26, fontWeight: 'bold', color: '#2c5f2d' },
  cardHint: { marginTop: 6, fontSize: 11, color: '#999' },
  chartsRow: { gap: 12 },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  chartTitle: { fontSize: 13, fontWeight: '800', color: '#222', marginBottom: 10 },
  action: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  actionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#222' },
});

