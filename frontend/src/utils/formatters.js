/**
 * Utility formatters for LKR Currency & Dates
 */

export function formatCurrency(amount, symbol = 'Rs.', code = 'LKR') {
  const numeric = Number(amount) || 0;
  return `${symbol} ${numeric.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
  });
}
