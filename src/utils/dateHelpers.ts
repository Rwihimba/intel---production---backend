export function isNullDate(dateStr: string | null): boolean {
  if (dateStr === null) return true;
  const trimmed = dateStr.trim();
  if (trimmed === '') return true;
  if (trimmed === '1970-01-01') return true;
  return false;
}

export function toNullableDate(dateStr: string | null): Date | null {
  if (isNullDate(dateStr)) return null;
  return new Date(dateStr as string);
}

export function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffMs = Math.abs(a.getTime() - b.getTime());
  return Math.floor(diffMs / MS_PER_DAY);
}

export function kigaliNow(): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Kigali',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return new Date(
    `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}:${get('second')}Z`
  );
}
