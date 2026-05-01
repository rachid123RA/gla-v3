import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-gifted-charts';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = Math.min(SCREEN_W - 48, 360);

/** Données de démonstration — à relier plus tard à une API / MQTT réelle */
const ZONES = [
  {
    id: 'nord',
    name: 'Zone Nord',
    parcelle: 'Parcelle A — Oliviers',
    coords: '34.052° N, 6.842° W',
    irrigationOk: true,
    debitEntree: 42.3,
    debitSortie: 38.1,
    sensors: [
      { id: 'H-N1', type: 'humidity', label: 'Humidité sol', value: 62, unit: '%', status: 'ok', spot: 'Rangée 1' },
      { id: 'T-N1', type: 'temperature', label: 'Température air', value: 24.2, unit: '°C', status: 'ok', spot: 'Station météo' },
      { id: 'D-N1', type: 'flow', label: 'Débit goutte-à-goutte', value: 38.1, unit: 'L/h', status: 'ok', spot: 'Collecteur principal' },
    ],
    actuators: [
      { id: 'V-N1', type: 'valve', label: 'Electrovanne secteur 1', state: 'ouverte', ok: true },
      { id: 'P-N1', type: 'pump', label: 'Pompe d\'irrigation', state: 'marche', ok: true },
    ],
  },
  {
    id: 'sud',
    name: 'Zone Sud',
    parcelle: 'Parcelle B — Agrumes',
    coords: '34.048° N, 6.839° W',
    irrigationOk: false,
    debitEntree: 55.0,
    debitSortie: 12.4,
    sensors: [
      { id: 'H-S1', type: 'humidity', label: 'Humidité sol', value: 38, unit: '%', status: 'warning', spot: 'Bas de pente' },
      { id: 'T-S1', type: 'temperature', label: 'Température air', value: 31.5, unit: '°C', status: 'ok', spot: 'Abri capteur' },
      { id: 'D-S1', type: 'flow', label: 'Débit ligne Sud', value: 12.4, unit: 'L/h', status: 'error', spot: 'Après filtre' },
    ],
    actuators: [
      { id: 'V-S1', type: 'valve', label: 'Electrovanne Sud', state: 'partielle', ok: false },
      { id: 'P-S1', type: 'pump', label: 'Pompe auxiliaire', state: 'arrêt', ok: true },
    ],
  },
  {
    id: 'est',
    name: 'Zone Est',
    parcelle: 'Parcelle C — Maraîchage',
    coords: '34.050° N, 6.836° W',
    irrigationOk: true,
    debitEntree: 48.7,
    debitSortie: 47.2,
    sensors: [
      { id: 'H-E1', type: 'humidity', label: 'Humidité sol', value: 71, unit: '%', status: 'ok', spot: 'Serre tunnel' },
      { id: 'T-E1', type: 'temperature', label: 'Température API météo', value: 22.8, unit: '°C', status: 'ok', spot: 'Sync Open-Meteo' },
      { id: 'D-E1', type: 'flow', label: 'Débit compteur', value: 47.2, unit: 'L/h', status: 'ok', spot: 'Compteur Est' },
    ],
    actuators: [
      { id: 'V-E1', type: 'valve', label: 'Vanne goutte-à-goutte', state: 'ouverte', ok: true },
      { id: 'P-E1', type: 'pump', label: 'Micro-pompe', state: 'marche', ok: true },
    ],
  },
  {
    id: 'ouest',
    name: 'Zone Ouest',
    parcelle: 'Parcelle D — Arboriculture',
    coords: '34.046° N, 6.844° W',
    irrigationOk: true,
    debitEntree: 33.2,
    debitSortie: 31.9,
    sensors: [
      { id: 'H-O1', type: 'humidity', label: 'Humidité sol', value: 55, unit: '%', status: 'ok', spot: 'Lisière bois' },
      { id: 'T-O1', type: 'temperature', label: 'Température air', value: 23.1, unit: '°C', status: 'ok', spot: 'Poteau Ouest' },
      { id: 'D-O1', type: 'flow', label: 'Débit sectoriel', value: 31.9, unit: 'L/h', status: 'warning', spot: 'Filtre encrassé (léger)' },
    ],
    actuators: [
      { id: 'V-O1', type: 'valve', label: 'Vanne principale Ouest', state: 'ouverte', ok: true },
      { id: 'P-O1', type: 'pump', label: 'Pompe forage', state: 'marche', ok: true },
    ],
  },
];

const ALERTS = [
  {
    id: 'a1',
    zone: 'Zone Sud',
    level: 'critical',
    title: 'Débit anormalement bas',
    detail: 'Ligne Sud : 12,4 L/h pour 55 L/h attendus — fuite ou colmatage possible.',
    time: 'Il y a 35 min',
  },
  {
    id: 'a2',
    zone: 'Zone Sud',
    level: 'warning',
    title: 'Humidité sol sous le seuil',
    detail: '38 % — irrigation recommandée après contrôle vanne.',
    time: 'Il y a 2 h',
  },
  {
    id: 'a3',
    zone: 'Zone Ouest',
    level: 'info',
    title: 'Maintenance filtre',
    detail: 'Débit légèrement réduit ; prévoir nettoyage filtre sous 48 h.',
    time: 'Hier',
  },
];

function statusColor(status) {
  if (status === 'ok') return '#2e7d32';
  if (status === 'warning') return '#f57c00';
  return '#c62828';
}

function sensorIcon(type) {
  if (type === 'humidity') return 'water';
  if (type === 'temperature') return 'thermometer';
  return 'pulse';
}

const CapteurScreen = () => {
  const navigation = useNavigation();
  const [expandedZone, setExpandedZone] = useState(null);

  const stats = useMemo(() => {
    let sensors = 0;
    let ok = 0;
    let warn = 0;
    let err = 0;
    ZONES.forEach((z) => {
      z.sensors.forEach((s) => {
        sensors += 1;
        if (s.status === 'ok') ok += 1;
        else if (s.status === 'warning') warn += 1;
        else err += 1;
      });
    });
    const irrigOk = ZONES.filter((z) => z.irrigationOk).length;
    return { sensors, ok, warn, err, irrigOk, zones: ZONES.length };
  }, []);

  const barCapteursParZone = useMemo(
    () =>
      ZONES.map((z) => ({
        value: z.sensors.length,
        label: z.name.replace('Zone ', ''),
        frontColor: z.sensors.some((s) => s.status === 'error')
          ? '#c62828'
          : z.sensors.some((s) => s.status === 'warning')
            ? '#f57c00'
            : '#2c5f2d',
      })),
    []
  );

  const lineDebit7j = useMemo(
    () =>
      [40, 42, 39, 55, 48, 44, 46].map((v, i) => ({
        value: v,
        label: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i],
      })),
    []
  );

  const allActuators = useMemo(
    () =>
      ZONES.flatMap((z) =>
        z.actuators.map((a) => ({ ...a, zoneName: z.name, irrigationOk: z.irrigationOk }))
      ),
    []
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
        <LinearGradient colors={['#1b4332', '#2c5f2d', '#40916c']} style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <MaterialCommunityIcons name="radar" size={40} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroTitle}>Capteurs & irrigation</Text>
          <Text style={styles.heroSub}>
            Vue globale des 4 zones agricoles, capteurs, actionneurs et alertes
          </Text>
        </LinearGradient>

        {/* Synthèse KPI */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderLeftColor: '#2c5f2d' }]}>
            <Text style={styles.kpiVal}>{stats.sensors}</Text>
            <Text style={styles.kpiLab}>Capteurs</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#2e7d32' }]}>
            <Text style={styles.kpiVal}>{stats.ok}</Text>
            <Text style={styles.kpiLab}>OK</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#f57c00' }]}>
            <Text style={styles.kpiVal}>{stats.warn}</Text>
            <Text style={styles.kpiLab}>Attention</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#c62828' }]}>
            <Text style={styles.kpiVal}>{stats.err}</Text>
            <Text style={styles.kpiLab}>Critique</Text>
          </View>
        </View>

        <View style={styles.irrigBanner}>
          <Ionicons
            name={stats.irrigOk === stats.zones ? 'checkmark-circle' : 'warning'}
            size={22}
            color={stats.irrigOk === stats.zones ? '#2e7d32' : '#e65100'}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.irrigTitle}>Irrigation</Text>
            <Text style={styles.irrigSub}>
              {stats.irrigOk}/{stats.zones} zones avec cycle conforme — contrôler les zones en alerte.
            </Text>
          </View>
        </View>

        {/* Schéma des 4 zones */}
        <Text style={styles.sectionTitle}>Schéma des zones</Text>
        <Text style={styles.sectionHint}>Localisation approximative sur la parcelle</Text>
        <View style={styles.mapGrid}>
          <View style={[styles.mapCell, styles.mapNord]}>
            <Text style={styles.mapCellTitle}>Nord</Text>
            <Text style={styles.mapCellSub}>3 capteurs</Text>
          </View>
          <View style={[styles.mapCell, styles.mapSud]}>
            <Text style={styles.mapCellTitle}>Sud</Text>
            <Text style={styles.mapCellSub}>Alerte débit</Text>
          </View>
          <View style={[styles.mapCell, styles.mapOuest]}>
            <Text style={styles.mapCellTitle}>Ouest</Text>
            <Text style={styles.mapCellSub}>Filtre</Text>
          </View>
          <View style={[styles.mapCell, styles.mapEst]}>
            <Text style={styles.mapCellTitle}>Est</Text>
            <Text style={styles.mapCellSub}>API météo</Text>
          </View>
        </View>

        {/* Graphiques */}
        <Text style={styles.sectionTitle}>Diagrammes</Text>
        <View style={styles.chartCard}>
          <Text style={styles.chartCardTitle}>Capteurs actifs par zone</Text>
          <BarChart
            data={barCapteursParZone}
            width={CHART_W}
            height={200}
            barWidth={28}
            spacing={24}
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor="#e2e8f0"
            rulesColor="#f1f5f9"
            yAxisTextStyle={{ color: '#64748b', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: '#475569', fontSize: 11 }}
            isAnimated
            roundedTop
            showGradient
            gradientColor="#95d5b2"
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartCardTitle}>Débit global entrant (7 jours, m³/h estimé)</Text>
          <LineChart
            data={lineDebit7j}
            width={CHART_W}
            height={190}
            color="#2c5f2d"
            thickness={2}
            spacing={36}
            curved
            areaChart
            startFillColor="#2c5f2d"
            endFillColor="#95d5b2"
            startOpacity={0.35}
            endOpacity={0.05}
            hideDataPoints={false}
            dataPointsColor="#1b4332"
            isAnimated
            yAxisTextStyle={{ color: '#64748b', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: '#475569', fontSize: 11 }}
          />
        </View>

        {/* Types de capteurs */}
        <Text style={styles.sectionTitle}>Familles de capteurs</Text>
        <View style={styles.typeRow}>
          <View style={styles.typeCard}>
            <Ionicons name="water" size={28} color="#0288d1" />
            <Text style={styles.typeName}>Humidité</Text>
            <Text style={styles.typeDesc}>Sondes sol, seuils d’irrigation</Text>
          </View>
          <View style={styles.typeCard}>
            <Ionicons name="thermometer" size={28} color="#d32f2f" />
            <Text style={styles.typeName}>Température</Text>
            <Text style={styles.typeDesc}>Air local + API météo</Text>
          </View>
          <View style={styles.typeCard}>
            <Ionicons name="pulse" size={28} color="#6a1b9a" />
            <Text style={styles.typeName}>Débit</Text>
            <Text style={styles.typeDesc}>Entrée / sortie, fuites</Text>
          </View>
        </View>

        {/* Actionneurs */}
        <Text style={styles.sectionTitle}>Actionneurs (vannes & pompes)</Text>
        <Text style={styles.sectionHint}>État en temps quasi réel — lié à chaque zone</Text>
        {allActuators.map((a) => (
          <View key={a.id} style={styles.actRow}>
            <View style={[styles.actIcon, { backgroundColor: a.type === 'pump' ? '#e3f2fd' : '#fff3e0' }]}>
              <MaterialCommunityIcons
                name={a.type === 'pump' ? 'water-pump' : 'pipe-valve'}
                size={24}
                color={a.type === 'pump' ? '#1565c0' : '#e65100'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actLabel}>{a.label}</Text>
              <Text style={styles.actZone}>{a.zoneName} · {a.state}</Text>
            </View>
            <View style={[styles.badge, a.ok ? styles.badgeOk : styles.badgeErr]}>
              <Text style={styles.badgeTxt}>{a.ok ? 'OK' : '!'}</Text>
            </View>
          </View>
        ))}

        {/* Détail par zone */}
        <Text style={styles.sectionTitle}>Zones agricoles & capteurs localisés</Text>
        {ZONES.map((zone) => {
          const open = expandedZone === zone.id;
          return (
            <View key={zone.id} style={styles.zoneCard}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setExpandedZone(open ? null : zone.id)}
                style={styles.zoneHeader}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.zoneName}>{zone.name}</Text>
                  <Text style={styles.zoneParcel}>{zone.parcelle}</Text>
                  <View style={styles.locRow}>
                    <Ionicons name="location" size={14} color="#2c5f2d" />
                    <Text style={styles.locText}>{zone.coords}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.irTag, zone.irrigationOk ? styles.irTagOk : styles.irTagBad]}>
                    <Text style={styles.irTagTxt}>{zone.irrigationOk ? 'Irrigation OK' : 'Anomalie'}</Text>
                  </View>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={22} color="#64748b" />
                </View>
              </TouchableOpacity>

              <View style={styles.debitMini}>
                <Text style={styles.debitMiniTxt}>
                  Débit entrant : <Text style={styles.debitStrong}>{zone.debitEntree} L/h</Text>
                </Text>
                <Text style={styles.debitMiniTxt}>
                  Débit sortie / consommé : <Text style={styles.debitStrong}>{zone.debitSortie} L/h</Text>
                </Text>
              </View>

              {open && (
                <View style={styles.zoneBody}>
                  <Text style={styles.subHead}>Capteurs</Text>
                  {zone.sensors.map((s) => (
                    <View key={s.id} style={styles.sensorRow}>
                      <Ionicons name={sensorIcon(s.type)} size={20} color={statusColor(s.status)} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.sensorId}>{s.id} · {s.label}</Text>
                        <Text style={styles.sensorSpot}>{s.spot}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.sensorVal, { color: statusColor(s.status) }]}>
                          {s.value}
                          {s.unit}
                        </Text>
                        <Text style={[styles.sensorSt, { color: statusColor(s.status) }]}>
                          {s.status === 'ok' ? 'Stable' : s.status === 'warning' ? 'Surveillance' : 'Critique'}
                        </Text>
                      </View>
                    </View>
                  ))}
                  <Text style={[styles.subHead, { marginTop: 14 }]}>Actionneurs zone</Text>
                  {zone.actuators.map((a) => (
                    <View key={a.id} style={styles.sensorRow}>
                      <MaterialCommunityIcons
                        name={a.type === 'pump' ? 'water-pump' : 'pipe-valve'}
                        size={20}
                        color={a.ok ? '#2e7d32' : '#c62828'}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.sensorId}>{a.label}</Text>
                        <Text style={styles.sensorSpot}>État : {a.state}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Notifications problèmes */}
        <Text style={styles.sectionTitle}>Notifications & problèmes</Text>
        {ALERTS.map((al) => (
          <View
            key={al.id}
            style={[
              styles.alertCard,
              al.level === 'critical' && styles.alertCrit,
              al.level === 'warning' && styles.alertWarn,
              al.level === 'info' && styles.alertInfo,
            ]}
          >
            <View style={styles.alertTop}>
              <Ionicons
                name={al.level === 'critical' ? 'alert-circle' : al.level === 'warning' ? 'warning' : 'information-circle'}
                size={22}
                color={al.level === 'critical' ? '#b71c1c' : al.level === 'warning' ? '#e65100' : '#1565c0'}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.alertTitle}>{al.title}</Text>
                <Text style={styles.alertZone}>{al.zone}</Text>
              </View>
              <Text style={styles.alertTime}>{al.time}</Text>
            </View>
            <Text style={styles.alertDetail}>{al.detail}</Text>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0fdf4' },
  scrollPad: { paddingBottom: 24 },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 12, padding: 4 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 4 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.88)', marginTop: 8, lineHeight: 20 },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: -18 },
  kpiCard: {
    flexGrow: 1,
    minWidth: '22%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  kpiVal: { fontSize: 20, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  kpiLab: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 2 },
  irrigBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  irrigTitle: { fontWeight: '700', color: '#14532d', fontSize: 15 },
  irrigSub: { fontSize: 13, color: '#475569', marginTop: 2 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14532d',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 4,
  },
  sectionHint: { fontSize: 12, color: '#64748b', marginHorizontal: 16, marginBottom: 10 },
  mapGrid: {
    marginHorizontal: 16,
    height: 200,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mapCell: {
    width: (SCREEN_W - 16 * 2 - 8) / 2 - 4,
    height: 94,
    borderRadius: 14,
    padding: 10,
    justifyContent: 'center',
  },
  mapNord: { backgroundColor: '#c8e6c9' },
  mapSud: { backgroundColor: '#ffcdd2' },
  mapEst: { backgroundColor: '#bbdefb' },
  mapOuest: { backgroundColor: '#fff9c4' },
  mapCellTitle: { fontWeight: '800', fontSize: 16, color: '#1b4332' },
  mapCellSub: { fontSize: 12, color: '#37474f', marginTop: 4 },
  chartCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  chartCardTitle: { alignSelf: 'flex-start', fontWeight: '700', color: '#334155', marginBottom: 12, fontSize: 14 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  typeCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeName: { fontWeight: '700', color: '#1e293b', marginTop: 8, fontSize: 13 },
  typeDesc: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 4 },
  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actLabel: { fontWeight: '700', color: '#1e293b', fontSize: 14 },
  actZone: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeOk: { backgroundColor: '#e8f5e9' },
  badgeErr: { backgroundColor: '#ffebee' },
  badgeTxt: { fontWeight: '800', fontSize: 12, color: '#333' },
  zoneCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  zoneHeader: { flexDirection: 'row', padding: 14 },
  zoneName: { fontSize: 17, fontWeight: '800', color: '#14532d' },
  zoneParcel: { fontSize: 13, color: '#64748b', marginTop: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  locText: { fontSize: 12, color: '#475569', marginLeft: 4 },
  irTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
  irTagOk: { backgroundColor: '#dcfce7' },
  irTagBad: { backgroundColor: '#ffedd5' },
  irTagTxt: { fontSize: 11, fontWeight: '700', color: '#14532d' },
  debitMini: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  debitMiniTxt: { fontSize: 12, color: '#64748b' },
  debitStrong: { fontWeight: '800', color: '#1e293b' },
  zoneBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  subHead: { fontSize: 13, fontWeight: '800', color: '#334155', marginBottom: 8 },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  sensorId: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  sensorSpot: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  sensorVal: { fontSize: 15, fontWeight: '800' },
  sensorSt: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  alertCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#cbd5e1',
  },
  alertCrit: { borderLeftColor: '#c62828', backgroundColor: '#fff5f5' },
  alertWarn: { borderLeftColor: '#f57c00', backgroundColor: '#fff8e1' },
  alertInfo: { borderLeftColor: '#1976d2', backgroundColor: '#f5f9ff' },
  alertTop: { flexDirection: 'row', alignItems: 'flex-start' },
  alertTitle: { fontWeight: '800', color: '#1e293b', fontSize: 14 },
  alertZone: { fontSize: 12, color: '#64748b', marginTop: 2 },
  alertTime: { fontSize: 11, color: '#94a3b8' },
  alertDetail: { fontSize: 13, color: '#475569', marginTop: 10, lineHeight: 19 },
});

export default CapteurScreen;
