const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const eurPrecise = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const monthFmtLong = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
});

const monthFmtShort = new Intl.DateTimeFormat('fr-FR', {
  month: 'short',
});

const monthFmtCompact = new Intl.DateTimeFormat('fr-FR', {
  month: 'short',
  year: '2-digit',
});

export function formatMoney(value, { precise = false } = {}) {
  if (value == null || Number.isNaN(value)) return '—';
  return (precise ? eurPrecise : eur).format(value);
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return percent.format(value / 100);
}

export function monthToDate(yyyymm) {
  const [y, m] = yyyymm.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

export function formatMonthLong(yyyymm) {
  return capitalize(monthFmtLong.format(monthToDate(yyyymm)));
}

export function formatMonthShort(yyyymm) {
  return capitalize(monthFmtShort.format(monthToDate(yyyymm)).replace('.', ''));
}

export function formatMonthCompact(yyyymm) {
  return capitalize(monthFmtCompact.format(monthToDate(yyyymm)).replace('.', ''));
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
