export function todayLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "Saturday, 14 November 2026"
export function longToday() {
  const d = new Date();
  const day = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const rest = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  return `${day}, ${rest}`;
}

// date 'YYYY-MM-DD' + time 'HH:MM:SS' -> "2026-11-14 10:42:10" ("-" when there is no date)
export function dateTime(date, time) {
  if (!date) return '-';
  return `${date} ${time || ''}`.trim();
}
