import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { data as temperatureData } from '../data/temperature_data';
import { data as humidityData } from '../data/humidity_data';
import { data as waterQuantityData } from '../data/water_quantity_data';
import {
  aggregateForPeriod,
  calculateStats,
  convertDataToSeries,
} from '../utils/analyseData';
import { generateAnalyseReportPdf } from '../utils/analyseReportPdf';

const SCREEN_WIDTH = Dimensions.get('window').width;

const DATASETS = {
  temperature: {
    label: 'Température',
    unit: '°C',
    icon: 'thermometer',
    color: '#FF6B6B',
    gradientColors: ['#FF6B6B', '#FF8E8E'],
    data: temperatureData,
    valueKey: 'temperature',
  },
  humidity: {
    label: 'Humidité',
    unit: '%',
    icon: 'water',
    color: '#4ECDC4',
    gradientColors: ['#4ECDC4', '#6EDDD6'],
    data: humidityData,
    valueKey: 'humidity',
  },
  water: {
    label: "Quantité d'eau",
    unit: 'L',
    icon: 'water-outline',
    color: '#45B7D1',
    gradientColors: ['#45B7D1', '#6BC5E0'],
    data: waterQuantityData,
    valueKey: 'water_quantity',
  },
};

function buildChartData(points, period, color, screenWidth) {
  const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  let labels = [];
  let chartData = [];

  const chartPadding = 64;
  const availableWidth = screenWidth - chartPadding;

  let spacing;
  let barWidth;
  const numPoints = points.length;

  if (period === 'week') {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    labels = points.map((p) => dayNames[p.date.getDay()]);
    barWidth = 28;
    spacing = Math.max(12, (availableWidth - numPoints * barWidth) / Math.max(1, numPoints - 1));
  } else if (period === 'month') {
    labels = points.map((p) => `${p.date.getDate()}`);
    barWidth = 12;
    spacing = Math.max(4, (availableWidth - numPoints * barWidth) / Math.max(1, numPoints - 1));
  } else {
    labels = points.map((p) => monthNames[p.date.getMonth()]);
    barWidth = 22;
    spacing = Math.max(15, (availableWidth - numPoints * barWidth) / Math.max(1, numPoints - 1));
  }

  const totalWidth = numPoints * barWidth + (numPoints - 1) * spacing;
  if (totalWidth > availableWidth) {
    const scale = availableWidth / totalWidth;
    barWidth *= scale;
    spacing *= scale;
  }

  chartData = points.map((p, index) => ({
    value: Number(p.value.toFixed(2)),
    label: labels[index],
    frontColor: color,
    topLabelComponent: () => (
      <Text style={{ color: '#6b7280', fontSize: 9, marginBottom: 2 }}>
        {p.value.toFixed(1)}
      </Text>
    ),
  }));

  return { data: chartData, labels, spacing: Math.max(2, spacing), barWidth: Math.max(8, barWidth) };
}

const AnalyseScreen = () => {
  const [metric, setMetric] = useState('temperature');
  const [period, setPeriod] = useState('week');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const seriesByMetric = useMemo(() => {
    const loaded = {};
    Object.entries(DATASETS).forEach(([key, def]) => {
      loaded[key] = convertDataToSeries(def.data, def.valueKey);
    });
    return loaded;
  }, []);

  const currentSeries = seriesByMetric[metric] || [];
  const points = useMemo(() => aggregateForPeriod(currentSeries, period), [currentSeries, period]);
  const stats = useMemo(() => calculateStats(points), [points]);

  const activeDef = DATASETS[metric];
  const { data: chartData, spacing, barWidth } = buildChartData(
    points,
    period,
    activeDef.color,
    SCREEN_WIDTH
  );

  const buildAllMetricsForReport = () =>
    Object.entries(DATASETS).map(([key, def]) => {
      const series = seriesByMetric[key] || [];
      const pts = aggregateForPeriod(series, period);
      return {
        label: def.label,
        unit: def.unit,
        stats: calculateStats(pts),
      };
    });

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const metrics = buildAllMetricsForReport();
      const pdfUri = await generateAnalyseReportPdf({ period, metrics });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Rapport d’analyse — MonAppIA',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Succès', `Rapport PDF généré :\n${pdfUri}`);
      }
    } catch (error) {
      console.error('PDF analyse:', error);
      Alert.alert(
        'Erreur',
        'Impossible de générer le rapport PDF. Réessayez ou redémarrez l’application.'
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={activeDef.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name={activeDef.icon} size={32} color="#fff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{activeDef.label}</Text>
            <Text style={styles.headerSubtitle}>Analyse des données</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.metricSelector}>
        {Object.entries(DATASETS).map(([key, def]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setMetric(key)}
            style={[styles.metricButton, metric === key && styles.metricButtonActive]}
          >
            <Ionicons name={def.icon} size={20} color={metric === key ? '#fff' : def.color} />
            <Text
              style={[styles.metricButtonText, metric === key && styles.metricButtonTextActive]}
            >
              {def.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#fff' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="trending-up" size={24} color={activeDef.color} />
          </View>
          <Text style={styles.statValue}>{stats.avg.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Moyenne</Text>
          <Text style={styles.statUnit}>{activeDef.unit}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fff' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="arrow-up" size={24} color="#FF6B6B" />
          </View>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{stats.max.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Maximum</Text>
          <Text style={styles.statUnit}>{activeDef.unit}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fff' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="arrow-down" size={24} color="#4ECDC4" />
          </View>
          <Text style={[styles.statValue, { color: '#4ECDC4' }]}>{stats.min.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Minimum</Text>
          <Text style={styles.statUnit}>{activeDef.unit}</Text>
        </View>
      </View>

      <View style={styles.periodSelector}>
        {[
          { key: 'week', label: 'Semaine', icon: 'calendar-outline' },
          { key: 'month', label: 'Mois', icon: 'calendar' },
          { key: 'year', label: 'Année', icon: 'calendar-sharp' },
        ].map(({ key, label, icon }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setPeriod(key)}
            style={[styles.periodButton, period === key && styles.periodButtonActive]}
          >
            <Ionicons name={icon} size={18} color={period === key ? '#fff' : activeDef.color} />
            <Text
              style={[styles.periodButtonText, period === key && styles.periodButtonTextActive]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Évolution des données</Text>
          <View style={styles.chartLegend}>
            <View style={[styles.legendDot, { backgroundColor: activeDef.color }]} />
            <Text style={styles.legendText}>{activeDef.label}</Text>
          </View>
        </View>
        {points.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateText}>Aucune donnée disponible</Text>
          </View>
        ) : (
          <View style={styles.chartWrapper}>
            {period === 'year' ? (
              <LineChart
                data={chartData}
                width={SCREEN_WIDTH - 64}
                height={260}
                color={activeDef.color}
                thickness={3}
                spacing={spacing || 25}
                hideRules={false}
                yAxisColor={activeDef.color}
                xAxisColor={activeDef.color}
                yAxisTextStyle={{ color: '#64748b', fontSize: 11 }}
                xAxisLabelTextStyle={{ color: '#64748b', fontSize: 9 }}
                curved
                startFillColor={activeDef.color}
                endFillColor={activeDef.color}
                startOpacity={0.4}
                endOpacity={0.1}
                areaChart
                showVerticalLines
                verticalLinesColor="#e2e8f0"
                isAnimated
                animationDuration={800}
              />
            ) : (
              <BarChart
                data={chartData}
                width={SCREEN_WIDTH - 64}
                height={260}
                spacing={spacing || 12}
                barWidth={barWidth || 18}
                noOfSections={5}
                yAxisThickness={1}
                xAxisThickness={1}
                yAxisColor={activeDef.color}
                xAxisColor={activeDef.color}
                yAxisTextStyle={{ color: '#64748b', fontSize: 11 }}
                xAxisLabelTextStyle={{ color: '#64748b', fontSize: 9 }}
                showVerticalLines
                verticalLinesColor="#e2e8f0"
                isAnimated
                animationDuration={800}
                frontColor={activeDef.color}
                gradientColor={activeDef.gradientColors[1]}
                showGradient
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.uploadCard}>
        <View style={styles.uploadHeader}>
          <Ionicons name="document-text" size={24} color={activeDef.color} />
          <Text style={styles.uploadTitle}>Rapport PDF complet</Text>
        </View>
        <Text style={styles.uploadDescription}>
          Télécharge un rapport PDF avec toutes les statistiques (température, humidité, quantité
          d’eau) pour la période sélectionnée.
        </Text>

        <TouchableOpacity
          onPress={handleDownloadPdf}
          disabled={generatingPdf}
          style={[styles.downloadButton, { backgroundColor: activeDef.color }]}
        >
          {generatingPdf ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={24} color="#fff" />
              <Text style={styles.downloadButtonText}>Télécharger le rapport PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { paddingBottom: 40 },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' },
  metricSelector: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 12 },
  metricButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  metricButtonActive: { backgroundColor: '#2c5f2d', borderColor: '#2c5f2d' },
  metricButtonText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  metricButtonTextActive: { color: '#fff' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 12 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 2 },
  statUnit: { fontSize: 10, color: '#94a3b8' },
  periodSelector: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 12 },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  periodButtonActive: { backgroundColor: '#2c5f2d', borderColor: '#2c5f2d' },
  periodButtonText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  periodButtonTextActive: { color: '#fff' },
  chartCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  chartWrapper: { width: '100%', overflow: 'hidden' },
  emptyState: { height: 260, justifyContent: 'center', alignItems: 'center' },
  emptyStateText: { marginTop: 12, fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  uploadCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  uploadHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  uploadDescription: { fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 20 },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  downloadButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default AnalyseScreen;
