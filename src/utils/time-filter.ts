/**
 * Filters an array of items by the selected time window.
 * Returns only items whose date falls within the window.
 */

type TimeWindow = '1h' | '6h' | '24h' | '48h' | '7d';

const WINDOW_MS: Record<TimeWindow, number> = {
  '1h':  1 * 60 * 60 * 1000,
  '6h':  6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '48h': 48 * 60 * 60 * 1000,
  '7d':  7 * 24 * 60 * 60 * 1000,
};

export function filterByTime<T>(
  items: T[],
  timeFilter: TimeWindow,
  getDate: (item: T) => Date | string,
): T[] {
  const cutoff = Date.now() - WINDOW_MS[timeFilter];
  return items.filter((item) => {
    const date = getDate(item);
    const timestamp = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
    if (isNaN(timestamp)) return true; // Keep items with invalid dates
    return timestamp >= cutoff;
  });
}

export function getTimeWindowLabel(timeFilter: TimeWindow): string {
  const labels: Record<TimeWindow, string> = {
    '1h':  'Last hour',
    '6h':  'Last 6 hours',
    '24h': 'Last 24 hours',
    '48h': 'Last 48 hours',
    '7d':  'Last 7 days',
  };
  return labels[timeFilter];
}
