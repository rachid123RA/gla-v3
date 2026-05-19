import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { getAdminMetrics, getAdminChartData } from '../../services/databaseService';

const CHART_W = Dimensions.get('window').width - 48;

const STATUS_COLORS = {
  active: '#2c5f2d',
  pending: '#fcb900',
  paused: '#90a4ae',
  cancelled: '#ef5350',
  expired: '#8d6e63',
  open: '#1565C0',
  closed: '#66bb6a',
};

export default function AdminDashboardScreen({ navigation }) {
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [mRes, cRes] = await Promise.all([getAdminMetrics(), getAdminChartData()]);
    if (mRes.success) setMetrics(mRes.data);
    if (cRes.success) setCharts(cRes.data);
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

  const subsStatusPie = useMemo(() => {
    const rows = charts?.subsByStatus || [];
    return rows.map((r) => ({
      value: r.count,
      color: STATUS_COLORS[r.status] || '#bdbdbd',
      text: r.status,
    }));
  }, [charts]);

  const subsPlanBar = useMemo(() => {
    const rows = charts?.subsByPlan || [];
    return rows.map((r) => ({
      value: r.count,
      label: r.plan,
      frontColor: r.plan === 'pro' ? '#7b1fa2' : r.plan === 'basic' ? '#1565C0' : '#2c5f2d',
    }));
  }, [charts]);

  const predLine = useMemo(() => {
    const rows = charts?.predByDay || [];
    return rows.map((r, i) => ({
      value: r.count,
      label: r.day ? String(r.day).slice(5) : `${i + 1}`,
    }));
  }, [charts]);

  const ticketsPie = useMemo(() => {
    const rows = charts?.ticketsByStatus || [];
    return rows.map((r) => ({
      value: r.count,
      color: STATUS_COLORS[r.status] || '#9e9e9e',
      text: r.status,
    }));
  }, [charts]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Ionicons name="shield-checkmark" size={28} color="#fcb900" />
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Dashboard Admin</Text>
          <Text style={styles.heroSubtitle}>Statistiques, graphiques et gestion</Text>
        </View>
      </View>

      <View style={styles.cardsGrid}>
        {[
          { label: 'Comptes', value: metrics?.totalUsers, color: '#E8F5E9', icon: 'people' },
          { label: 'Prédictions', value: metrics?.totalPredictions, color: '#FFF3E0', icon: 'analytics' },
          { label: 'Actifs', value: metrics?.usersWithPredictions, color: '#E3F2FD', icon: 'person' },
          { label: 'Abonnements', value: metrics?.totalSubscriptions, color: '#F3E5F5', icon: 'card' },
          { label: 'Tickets ouverts', value: metrics?.openTickets, color: '#FFEBEE', icon: 'mail-unread' },
          { label: 'Notifs actives', value: metrics?.activeNotifications, color: '#FFFDE7', icon: 'notifications' },
        ].map((c) => (
          <View key={c.label} style={[styles.miniCard, { backgroundColor: c.color }]}>
            <Ionicons name={c.icon} size={22} color="#2c5f2d" />
            <Text style={styles.miniValue}>{c.value ?? '-'}</Text>
            <Text style={styles.miniLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Histogrammes & comparaisons</Text>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Comptes vs Prédictions vs Tickets</Text>
        <BarChart
          width={CHART_W - 24}
          barWidth={28}
          spacing={20}
          roundedTop
          hideRules
          yAxisThickness={0}
          xAxisThickness={0}
          noOfSections={4}
          data={[
            { value: metrics?.totalUsers ?? 0, label: 'Users', frontColor: '#2c5f2d' },
            { value: metrics?.totalPredictions ?? 0, label: 'Préd.', frontColor: '#fcb900' },
            { value: metrics?.openTickets ?? 0, label: 'Tickets', frontColor: '#1565C0' },
          ]}
        />
      </View>

      {subsPlanBar.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Abonnements par plan</Text>
          <BarChart
            width={CHART_W - 24}
            barWidth={36}
            spacing={24}
            roundedTop
            data={subsPlanBar}
          />
        </View>
      )}

      {predLine.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Prédictions (7 derniers jours)</Text>
          <LineChart
            data={predLine}
            width={CHART_W - 24}
            height={180}
            color="#2c5f2d"
            thickness={3}
            curved
            areaChart
            startFillColor="#2c5f2d"
            endFillColor="#2c5f2d"
            startOpacity={0.3}
            endOpacity={0.05}
          />
        </View>
      )}

      <Text style={styles.sectionTitle}>Diagrammes circulaires</Text>
      <View style={styles.pieRow}>
        <View style={[styles.chartCard, styles.pieCard]}>
          <Text style={styles.chartTitle}>Utilisateurs actifs</Text>
          <PieChart
            donut
            radius={64}
            innerRadius={38}
            data={[
              { value: metrics?.usersWithPredictions ?? 0, color: '#2c5f2d' },
              {
                value: Math.max((metrics?.totalUsers ?? 0) - (metrics?.usersWithPredictions ?? 0), 0),
                color: '#e0e0e0',
              },
            ]}
            centerLabelComponent={() => (
              <Text style={styles.pieCenter}>{metrics?.usersWithPredictions ?? 0}</Text>
            )}
          />
          <Text style={styles.pieLegend}>Avec ≥1 prédiction</Text>
        </View>

        {subsStatusPie.length > 0 && (
          <View style={[styles.chartCard, styles.pieCard]}>
            <Text style={styles.chartTitle}>Statuts abonnements</Text>
            <PieChart donut radius={64} innerRadius={38} data={subsStatusPie} />
          </View>
        )}
      </View>

      {ticketsPie.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Tickets support par statut</Text>
          <View style={styles.pieCenterWrap}>
            <PieChart donut radius={72} innerRadius={44} data={ticketsPie} />
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Gestion</Text>

      <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('AdminNotifications')}>
        <Ionicons name="notifications" size={22} color="#fcb900" />
        <Text style={styles.actionText}>Gestion des notifications</Text>
        <Ionicons name="chevron-forward" size={18} color="#999" />
      </TouchableOpacity>

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

      <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('AdminSupport')}>
        <Ionicons name="headset-outline" size={22} color="#2c5f2d" />
        <Text style={styles.actionText}>Gestion support</Text>
        <Ionicons name="chevron-forward" size={18} color="#999" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4f0d2' },
  content: { padding: 16, paddingBottom: 36 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c5f2d',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  heroText: { flex: 1 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f3f1f', marginTop: 18, marginBottom: 10 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  miniCard: {
    width: '31%',
    minWidth: 100,
    flexGrow: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  miniValue: { fontSize: 22, fontWeight: '900', color: '#1B5E20', marginTop: 6 },
  miniLabel: { fontSize: 10, color: '#555', textAlign: 'center', marginTop: 4, fontWeight: '600' },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  chartTitle: { fontSize: 13, fontWeight: '800', color: '#222', marginBottom: 12, alignSelf: 'flex-start' },
  pieRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  pieCard: { flex: 1, minWidth: 150, alignItems: 'center' },
  pieCenter: { fontWeight: '900', fontSize: 18, color: '#1f3f1f' },
  pieLegend: { fontSize: 11, color: '#666', marginTop: 8 },
  pieCenterWrap: { alignItems: 'center', paddingVertical: 8 },
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
