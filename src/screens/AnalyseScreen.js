import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { data as temperatureData } from '../data/temperature_data';
import { data as humidityData } from '../data/humidity_data';
import { data as waterQuantityData } from '../data/water_quantity_data';

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
    label: "Humidité",
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

function getDateRange(filteredTo, period) {
  const end = new Date(filteredTo);
  const start = new Date(end);
  if (period === 'week') start.setDate(end.getDate() - 6);
  else if (period === 'month') start.setDate(end.getDate() - 29);
  else start.setFullYear(end.getFullYear() - 1);
  return { start, end };
}

function aggregateForPeriod(series, period) {
  if (series.length === 0) return [];
  const end = series[series.length - 1].date;
  const { start } = getDateRange(end, period);
  const within = series.filter(p => p.date >= start && p.date <= end);

  if (period !== 'year') {
    return within;
  }

  const monthMap = new Map();
  within.forEach(p => {
    const key = `${p.date.getFullYear()}-${p.date.getMonth()}`;
    const acc = monthMap.get(key) || { sum: 0, count: 0, month: p.date.getMonth(), year: p.date.getFullYear() };
    acc.sum += p.value;
    acc.count += 1;
    monthMap.set(key, acc);
  });
  const months = Array.from(monthMap.values())
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map(m => ({ date: new Date(m.year, m.month, 1), value: m.sum / Math.max(m.count, 1) }));
  return months;
}

function calculateStats(points) {
  if (points.length === 0) return { avg: 0, min: 0, max: 0 };
  const values = points.map(p => p.value);
  return {
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function buildChartData(points, period, color, screenWidth) {
  const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  let labels = [];
  let chartData = [];
  
  // Calculer la largeur disponible pour le graphique (padding + marges)
  const chartPadding = 64; // padding horizontal total (20px de chaque côté + 24px de padding card)
  const availableWidth = screenWidth - chartPadding;
  
  // Calculer l'espacement et la largeur des barres dynamiquement
  let spacing, barWidth;
  const numPoints = points.length;
  
  if (period === 'week') {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    labels = points.map(p => dayNames[p.date.getDay()]);
    // Pour 7 points, on peut avoir plus d'espace
    barWidth = 28;
    spacing = Math.max(12, (availableWidth - (numPoints * barWidth)) / Math.max(1, numPoints - 1));
  } else if (period === 'month') {
    labels = points.map(p => `${p.date.getDate()}`);
    // Pour 30 points, on doit réduire l'espacement et la largeur des barres
    barWidth = 12;
    spacing = Math.max(4, (availableWidth - (numPoints * barWidth)) / Math.max(1, numPoints - 1));
  } else {
    labels = points.map(p => monthNames[p.date.getMonth()]);
    // Pour 12 mois, on peut avoir un espacement confortable
    barWidth = 22;
    spacing = Math.max(15, (availableWidth - (numPoints * barWidth)) / Math.max(1, numPoints - 1));
  }
  
  // S'assurer que la largeur totale ne dépasse pas
  const totalWidth = (numPoints * barWidth) + ((numPoints - 1) * spacing);
  if (totalWidth > availableWidth) {
    // Ajuster proportionnellement
    const scale = availableWidth / totalWidth;
    barWidth = barWidth * scale;
    spacing = spacing * scale;
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

function convertDataToSeries(dataArray, valueKey) {
  return dataArray
    .filter(item => item.date && item[valueKey] !== undefined && item[valueKey] !== null)
    .map(item => ({ date: new Date(item.date), value: Number(item[valueKey]) }))
    .sort((a, b) => a.date - b.date);
}

const AnalyseScreen = () => {
  const [metric, setMetric] = useState('temperature');
  const [period, setPeriod] = useState('week');
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [uploading, setUploading] = useState(false);

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
  const { data: chartData, spacing, barWidth } = buildChartData(points, period, activeDef.color, SCREEN_WIDTH);

  const handleUploadPDF = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadedPdf(result.assets[0]);
        Alert.alert('Succès', 'Fichier PDF téléchargé avec succès !');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le fichier PDF');
      console.error('PDF upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSharePDF = async () => {
    if (!uploadedPdf) {
      Alert.alert('Aucun fichier', 'Veuillez d\'abord télécharger un fichier PDF');
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uploadedPdf.uri);
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager le fichier');
      console.error('Share error:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header avec gradient */}
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

      {/* Boutons de sélection de métrique */}
      <View style={styles.metricSelector}>
        {Object.entries(DATASETS).map(([key, def]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setMetric(key)}
            style={[
              styles.metricButton,
              metric === key && styles.metricButtonActive,
            ]}
          >
            <Ionicons
              name={def.icon}
              size={20}
              color={metric === key ? '#fff' : def.color}
            />
            <Text
              style={[
                styles.metricButtonText,
                metric === key && styles.metricButtonTextActive,
              ]}
            >
              {def.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Cartes de statistiques */}
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
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
            {stats.max.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Maximum</Text>
          <Text style={styles.statUnit}>{activeDef.unit}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#fff' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="arrow-down" size={24} color="#4ECDC4" />
          </View>
          <Text style={[styles.statValue, { color: '#4ECDC4' }]}>
            {stats.min.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Minimum</Text>
          <Text style={styles.statUnit}>{activeDef.unit}</Text>
        </View>
      </View>

      {/* Filtres de période */}
      <View style={styles.periodSelector}>
        {[
          { key: 'week', label: 'Semaine', icon: 'calendar-outline' },
          { key: 'month', label: 'Mois', icon: 'calendar' },
          { key: 'year', label: 'Année', icon: 'calendar-sharp' },
        ].map(({ key, label, icon }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setPeriod(key)}
            style={[
              styles.periodButton,
              period === key && styles.periodButtonActive,
            ]}
          >
            <Ionicons
              name={icon}
              size={18}
              color={period === key ? '#fff' : activeDef.color}
            />
            <Text
              style={[
                styles.periodButtonText,
                period === key && styles.periodButtonTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Graphique */}
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

      {/* Section Upload PDF */}
      <View style={styles.uploadCard}>
        <View style={styles.uploadHeader}>
          <Ionicons name="document-text" size={24} color={activeDef.color} />
          <Text style={styles.uploadTitle}>Télécharger un rapport PDF</Text>
        </View>
        <Text style={styles.uploadDescription}>
          Téléchargez un fichier PDF pour l'analyser ou le partager
        </Text>
        
        {uploadedPdf ? (
          <View style={styles.uploadedFileContainer}>
            <View style={styles.uploadedFileInfo}>
              <Ionicons name="document" size={24} color={activeDef.color} />
              <View style={styles.uploadedFileDetails}>
                <Text style={styles.uploadedFileName} numberOfLines={1}>
                  {uploadedPdf.name}
                </Text>
                <Text style={styles.uploadedFileSize}>
                  {(uploadedPdf.size / 1024).toFixed(2)} KB
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSharePDF}
              style={[styles.shareButton, { backgroundColor: activeDef.color }]}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleUploadPDF}
            disabled={uploading}
            style={[styles.uploadButton, { borderColor: activeDef.color }]}
          >
            {uploading ? (
              <ActivityIndicator color={activeDef.color} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color={activeDef.color} />
                <Text style={[styles.uploadButtonText, { color: activeDef.color }]}>
                  Choisir un fichier PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    paddingBottom: 32,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  metricSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
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
  metricButtonActive: {
    backgroundColor: '#2c5f2d',
    borderColor: '#2c5f2d',
  },
  metricButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  metricButtonTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
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
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 10,
    color: '#94a3b8',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
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
  periodButtonActive: {
    backgroundColor: '#2c5f2d',
    borderColor: '#2c5f2d',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
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
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  chartWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
    width: SCREEN_WIDTH - 64,
  },
  emptyState: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
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
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  uploadDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  uploadedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  uploadedFileDetails: {
    flex: 1,
  },
  uploadedFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  uploadedFileSize: {
    fontSize: 12,
    color: '#64748b',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnalyseScreen;
