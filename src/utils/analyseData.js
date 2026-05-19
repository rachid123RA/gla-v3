export function getDateRange(filteredTo, period) {
  const end = new Date(filteredTo);
  const start = new Date(end);
  if (period === 'week') start.setDate(end.getDate() - 6);
  else if (period === 'month') start.setDate(end.getDate() - 29);
  else start.setFullYear(end.getFullYear() - 1);
  return { start, end };
}

export function aggregateForPeriod(series, period) {
  if (series.length === 0) return [];
  const end = series[series.length - 1].date;
  const { start } = getDateRange(end, period);
  const within = series.filter((p) => p.date >= start && p.date <= end);

  if (period !== 'year') {
    return within;
  }

  const monthMap = new Map();
  within.forEach((p) => {
    const key = `${p.date.getFullYear()}-${p.date.getMonth()}`;
    const acc = monthMap.get(key) || {
      sum: 0,
      count: 0,
      month: p.date.getMonth(),
      year: p.date.getFullYear(),
    };
    acc.sum += p.value;
    acc.count += 1;
    monthMap.set(key, acc);
  });
  return Array.from(monthMap.values())
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((m) => ({
      date: new Date(m.year, m.month, 1),
      value: m.sum / Math.max(m.count, 1),
    }));
}

export function calculateStats(points) {
  if (points.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };
  const values = points.map((p) => p.value);
  return {
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  };
}

export function convertDataToSeries(dataArray, valueKey) {
  return dataArray
    .filter((item) => item.date && item[valueKey] !== undefined && item[valueKey] !== null)
    .map((item) => ({ date: new Date(item.date), value: Number(item[valueKey]) }))
    .sort((a, b) => a.date - b.date);
}

export const PERIOD_LABELS = {
  week: 'Semaine (7 jours)',
  month: 'Mois (30 jours)',
  year: 'Année (par mois)',
};
