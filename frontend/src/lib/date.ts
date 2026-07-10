export const RELEASE_TIME_ZONE = 'Europe/Sofia';

export function formatReleaseDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function isReleaseDateInFuture(dateString: string): boolean {
  const releaseDate = parseDateOnly(dateString);
  const today = getDatePartsInTimeZone(new Date(), RELEASE_TIME_ZONE);

  return compareDateParts(releaseDate, today) > 0;
}

function parseDateOnly(dateString: string): DateParts {
  const [year, month, day] = dateString.split('-').map(Number);
  return { year, month, day };
}

function getDatePartsInTimeZone(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value),
  };
}

function compareDateParts(a: DateParts, b: DateParts): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}
