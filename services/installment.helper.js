// installment.helper.js

function parseDateString(dateStr) {
  if (!dateStr) return null;

  // If Date object → convert to yyyy-mm-dd
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return null;
    return dateStr.toISOString().slice(0, 10);
  }

  if (typeof dateStr !== 'string') return null;

  // Accept only yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  return null;
}

exports.getPurchaseDate = (rowOrDate) => {
  if (!rowOrDate) return null;

  if (typeof rowOrDate === 'string' || rowOrDate instanceof Date) {
    return parseDateString(rowOrDate);
  }

  return parseDateString(rowOrDate.date);
};

exports.computeStatementDate = (purchaseDate, currentInstallment = 1) => {
  const baseStr = parseDateString(purchaseDate);
  if (!baseStr) return null;

  const [year, month, day] = baseStr.split('-').map(Number);

  // Create UTC date ONLY for safe month math
  const baseDate = new Date(Date.UTC(year, month - 1, 1));

  baseDate.setUTCMonth(baseDate.getUTCMonth() + (currentInstallment - 1));

  const targetYear = baseDate.getUTCFullYear();
  const targetMonth = baseDate.getUTCMonth();

  // Get last day of target month
  const lastDay = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();

  const safeDay = Math.min(day, lastDay);

  const finalDate = new Date(Date.UTC(targetYear, targetMonth, safeDay));

  return finalDate.toISOString().slice(0, 10);
};
