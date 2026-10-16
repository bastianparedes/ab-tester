type TimeUnit = 'minutes' | 'hours' | 'days';

type FilterByDateParams<T> = {
  items: T[];
  timeUnit: TimeUnit;
  value: number;
};

export function filterByDate<T extends { date: Date }>({ items, timeUnit, value }: FilterByDateParams<T>): T[] {
  const unitToMs: Record<TimeUnit, number> = {
    days: 86400000,
    hours: 3600000,
    minutes: 60000,
  };

  const now = Date.now();
  const limit = now - value * unitToMs[timeUnit];

  let left = 0;
  let right = items.length;

  while (left < right) {
    const mid = (left + right) >> 1;

    if (items[mid].date.getTime() < limit) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return items.slice(left);
}
