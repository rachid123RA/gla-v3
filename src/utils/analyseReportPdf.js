import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { PERIOD_LABELS } from './analyseData';

function formatDate(d) {
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildHtmlReport({ period, metrics }) {
  const periodLabel = PERIOD_LABELS[period] || period;
  const rows = metrics
    .map(
      (m) => `
    <tr>
      <td><strong>${m.label}</strong></td>
      <td align="center">${m.stats.avg.toFixed(2)} ${m.unit}</td>
      <td align="center">${m.stats.min.toFixed(2)} ${m.unit}</td>
      <td align="center">${m.stats.max.toFixed(2)} ${m.unit}</td>
      <td align="center">${m.stats.count}</td>
    </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; }
    h1 { color: #2c5f2d; font-size: 22px; margin-bottom: 4px; }
    h2 { color: #475569; font-size: 14px; font-weight: normal; margin-top: 0; }
    .meta { background: #f1f5f9; padding: 12px; border-radius: 8px; margin: 16px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th { background: #2c5f2d; color: #fff; padding: 10px 8px; text-align: center; }
    td { border: 1px solid #e2e8f0; padding: 10px 8px; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; }
    .note { font-size: 12px; color: #64748b; margin-top: 16px; line-height: 1.5; }
  </style>
</head>
<body>
  <h1>Rapport d'analyse agricole</h1>
  <h2>MonAppIA / GollaSense — synthèse des capteurs</h2>
  <div class="meta">
    <p><strong>Date du rapport :</strong> ${formatDate(new Date())}</p>
    <p><strong>Période analysée :</strong> ${periodLabel}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Indicateur</th>
        <th>Moyenne</th>
        <th>Minimum</th>
        <th>Maximum</th>
        <th>Points</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <p class="note">
    Ce document résume les statistiques de température, d'humidité et de quantité d'eau
    pour la période sélectionnée dans l'écran Analyse.
  </p>
  <p class="footer">Généré automatiquement par MonAppIA</p>
</body>
</html>`;
}

/**
 * Génère un PDF récapitulatif (toutes les métriques) et retourne l'URI locale.
 */
export async function generateAnalyseReportPdf({ period, metrics }) {
  const html = buildHtmlReport({ period, metrics });
  const { uri } = await Print.printToFileAsync({ html });

  const dest = `${FileSystem.documentDirectory}rapport_analyse_${Date.now()}.pdf`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}
