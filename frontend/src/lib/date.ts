export function formatReleaseDate(dateString: string): string {
  // dateString is a plain "YYYY-MM-DD" with no time component. Parsing it
  // via `new Date(dateString)` treats it as UTC midnight, which then rolls
  // back a day once rendered in any timezone west of UTC — build the date
  // from its local components instead so the calendar day never shifts.
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}